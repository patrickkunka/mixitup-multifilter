/* global mixitup, h, diacriticsMap */

mixitup.FilterGroup = function() {
    this.name               = '';
    this.dom                = new mixitup.FilterGroupDom();
    this.activeSelectors    = [];
    this.activeFilters      = [];
    this.activeToggles      = [];
    this.handler            = null;
    this.mixer              = null;
    this.logic              = 'or';
    this.parseOn            = 'change';
    this.keyupTimeout       = -1;

    h.seal(this);
};

h.extend(mixitup.FilterGroup.prototype, {

    /**
     * @private
     * @param {HTMLELement}     el
     * @param {mixitup.Mixer}   mixer
     * @return {void}
     */

    init: function(el, mixer) {
        var self  = this,
            logic = el.getAttribute('data-logic');

        self.dom.el = el;

        this.name = self.dom.el.getAttribute('data-filter-group') || '';

        self.cacheDom();

        if (self.dom.form) {
            self.enableButtons();
        }

        self.mixer = mixer;

        if ((logic && logic.toLowerCase() === 'and') || mixer.config.multifilter.logicWithinGroup === 'and') {
            // override default group logic

            self.logic = 'and';

        }

        self.bindEvents();
    },

    /**
     * @private
     * @return {void}
     */

    cacheDom: function() {
        var self = this;

        self.dom.form = h.closestParent(self.dom.el, 'form', true);
    },

    enableButtons: function() {
        var self    = this,
            buttons = self.dom.form.querySelectorAll('button[type="submit"]:disabled'),
            button  = null,
            i       = -1;

        for (i = 0; button = buttons[i]; i++) {
            if (button.disabled) {
                button.disabled = false;
            }
        }
    },

    /**
     * @private
     * @return {void}
     */

    bindEvents: function() {
        var self = this;

        self.handler = function(e) {
            switch (e.type) {
                case 'reset':
                case 'submit':
                    self.handleFormEvent(e);

                    break;
                default:
                    self['handle' + h.pascalCase(e.type)](e);
            }
        };

        h.on(self.dom.el, 'click', self.handler);
        h.on(self.dom.el, 'change', self.handler);
        h.on(self.dom.el, 'keyup', self.handler);

        if (self.dom.form) {
            h.on(self.dom.form, 'reset', self.handler);
            h.on(self.dom.form, 'submit', self.handler);
        }
    },

    /**
     * @private
     * @return {void}
     */

    unbindEvents: function() {
        var self = this;

        h.off(self.dom.el, 'click', self.handler);
        h.off(self.dom.el, 'change', self.handler);
        h.off(self.dom.el, 'keyup', self.handler);

        if (self.dom.form) {
            h.off(self.dom.form, 'reset', self.handler);
            h.off(self.dom.form, 'submit', self.handler);
        }

        self.handler = null;
    },

    /**
     * @private
     * @param   {MouseEvent} e
     * @return  {void}
     */

    handleClick: function(e) {
        var self            = this,
            mixer           = self.mixer,
            returnValue     = null,
            controlEl       = h.closestParent(e.target, '[data-filter], [data-toggle]', true),
            controlSelector = '',
            index           = -1,
            selector        = '';

        if (!controlEl) return;

        if ((controlSelector = self.mixer.config.selectors.control) && !controlEl.matches(controlSelector)) {
            return;
        }

        e.stopPropagation();

        if (!mixer.lastClicked) {
            mixer.lastClicked = controlEl;
        }

        if (typeof mixer.config.callbacks.onMixClick === 'function') {
            returnValue = mixer.config.callbacks.onMixClick.call(mixer.lastClicked, mixer.state, e, self);

            if (returnValue === false) {
                // User has returned `false` from the callback, so do not handle click

                return;
            }
        }

        if (controlEl.matches('[data-filter]')) {
            selector = controlEl.getAttribute('data-filter');

            self.activeToggles = [];
            self.activeSelectors = self.activeFilters = [selector];
        } else if (controlEl.matches('[data-toggle]')) {
            selector = controlEl.getAttribute('data-toggle');

            self.activeFilters = [];

            if ((index = self.activeToggles.indexOf(selector)) > -1) {
                self.activeToggles.splice(index, 1);
            } else {
                self.activeToggles.push(selector);
            }

            if (self.logic === 'and') {
                // Compress into single node

                self.activeSelectors = [self.activeToggles];
            } else {
                self.activeSelectors = self.activeToggles;
            }
        }

        self.updateControls();

        if (self.mixer.config.multifilter.parseOn === 'change') {
            self.mixer.parseFilterGroups();
        }
    },

    /**
     * @private
     * @param   {Event} e
     * @return  {void}
     */

    handleChange: function(e) {
        var self    = this,
            input   = e.target;

        e.stopPropagation();

        switch(input.type) {
            case 'text':
            case 'search':
            case 'email':
            case 'select-one':
            case 'radio':
                self.getSingleValue(input);

                break;
            case 'checkbox':
            case 'select-multiple':
                self.getMultipleValues(input);

                break;
        }

        if (self.mixer.config.multifilter.parseOn === 'change') {
            self.mixer.parseFilterGroups();
        }
    },

    handleKeyup: function(e) {
        var self    = this,
            input   = e.target;

        // NB: Selects can fire keyup events (e.g. multiselect, textual search)

        if (['text', 'search', 'email'].indexOf(input.type) < 0) return;

        if (self.mixer.config.multifilter.parseOn !== 'change') {
            self.mixer.getSingleValue(input);

            return;
        }

        clearTimeout(self.keyupTimeout);

        self.keyupTimeout = setTimeout(function() {
            self.getSingleValue(input);
            self.mixer.parseFilterGroups();
        }, self.mixer.config.multifilter.keyupThrottleDuration);
    },

    /**
     * @private
     * @param   {Event} e
     * @return  {void}
     */

    handleFormEvent: function(e) {
        var self            = this,
            tracker         = null,
            group           = null,
            i               = -1;

        if (e.type === 'submit') {
            e.preventDefault();
        }

        if (e.type === 'reset') {
            self.activeFilters    =
            self.activeToggles   =
            self.activeSelectors = [];

            self.updateControls();
        }

        if (!self.mixer.multifilterFormEventTracker) {
            tracker = self.mixer.multifilterFormEventTracker = new mixitup.MultifilterFormEventTracker();

            tracker.form = e.target;

            for (i = 0; group = self.mixer.filterGroups[i]; i++) {
                if (group.dom.form !== e.target) continue;

                tracker.totalBound++;
            }
        } else {
            tracker = self.mixer.multifilterFormEventTracker;
        }

        if (e.target === tracker.form) {
            tracker.totalHandled++;

            if (tracker.totalHandled === tracker.totalBound) {
                self.mixer.multifilterFormEventTracker = null;

                if (e.type === 'submit' || self.mixer.config.multifilter.parseOn === 'change') {
                    self.mixer.parseFilterGroups();
                }
            }
        }
    },

    /**
     * @private
     * @param   {HTMLELement} input
     * @return  {void}
     */

    getSingleValue: function(input) {
        var self            = this,
            diacriticMap    = null,
            attributeName   = '',
            selector        = '',
            value           = '',
            i               = -1;

        if (input.type.match(/text|search|email/g)) {
            attributeName = input.getAttribute('data-search-attribute');

            if (!attributeName) {
                throw new Error('[MixItUp MultiFilter] A valid `data-search-attribute` must be present on text inputs');
            }

            if (input.value.length < self.mixer.config.multifilter.minSearchLength) {
                self.activeSelectors = self.activeFilters = self.activeToggles = [''];

                return;
            }

            // Lowercase and trim

            value = input.value.toLowerCase().trim();

            // Replace diacritics

            for (i = 0; (diacriticMap = diacriticsMap[i]); i++) {
                value = value.replace(diacriticMap[1], diacriticMap[0]);
            }

            // Strip non-word characters

            value = value.replace(/\W+/g, ' ');

            selector = '[' + attributeName + '*="' + value + '"]';
        } else {
            selector = input.value;
        }

        if (typeof input.value === 'string') {
            self.activeSelectors =
            self.activeToggles =
            self.activeFilters =
                    selector ? [selector] : [];
        }
    },

    /**
     * @private
     * @param   {HTMLELement} input
     * @return  {void}
     */

    getMultipleValues: function(input) {
        var self            = this,
            activeToggles   = [],
            query           = '',
            item            = null,
            items           = null,
            i               = -1;

        switch (input.type) {
            case 'checkbox':
                query = 'input[type="checkbox"]';

                break;
            case 'select-multiple':
                query = 'option';
        }

        items = self.dom.el.querySelectorAll(query);

        for (i = 0; item = items[i]; i++) {
            if ((item.checked || item.selected) && item.value) {
                activeToggles.push(item.value);
            }
        }

        self.activeFilters = [];
        self.activeToggles = activeToggles;

        if (self.logic === 'and') {
            // Compress into single node

            self.activeSelectors = [activeToggles];
        } else {
            self.activeSelectors = activeToggles;
        }
    },

    /**
     * @private
     * @param   {Array.<HTMLELement>} [controlEls]
     * @return  {void}
     */

    updateControls: function(controlEls) {
        var self             = this,
            controlEl        = null,
            controlSelector  = '',
            controlsSelector = '',
            type             = '',
            i                = -1;

        controlSelector = self.mixer.config.selectors.control.trim();

        controlsSelector = [
            '[data-filter]' + controlSelector,
            '[data-toggle]' + controlSelector
        ].join(', ');

        controlEls = controlEls || self.dom.el.querySelectorAll(controlsSelector);

        for (i = 0; controlEl = controlEls[i]; i++) {
            type = Boolean(controlEl.getAttribute('data-toggle')) ? 'toggle' : 'filter';

            self.updateControl(controlEl, type);
        }
    },

    /**
     * @private
     * @param   {HTMLELement}   controlEl
     * @param   {string}        type
     * @return  {void}
     */

    updateControl: function(controlEl, type) {
        var self            = this,
            selector        = controlEl.getAttribute('data-' + type),
            activeControls  = self.activeToggles.concat(self.activeFilters),
            activeClassName = '';

        activeClassName = h.getClassname(self.mixer.config.classNames, type, self.mixer.config.classNames.modifierActive);

        if (activeControls.indexOf(selector) > -1) {
            h.addClass(controlEl, activeClassName);
        } else {
            h.removeClass(controlEl, activeClassName);
        }
    },

    /**
     * @private
     */

    updateUi: function() {
        var self           = this,
            controlEls     = self.dom.el.querySelectorAll('[data-filter], [data-toggle]'),
            inputEls       = self.dom.el.querySelectorAll('input[type="radio"], input[type="checkbox"], option'),
            activeControls = self.activeToggles.concat(self.activeFilters),
            isActive       = false,
            inputEl        = null,
            i              = -1;

        if (controlEls.length) {
            self.updateControls(controlEls, true);
        }

        for (i = 0; inputEl = inputEls[i]; i++) {
            isActive = activeControls.indexOf(inputEl.value) > -1;

            switch (inputEl.tagName.toLowerCase()) {
                case 'option':
                    inputEl.selected = isActive;

                    break;
                case 'input':
                    inputEl.checked = isActive;

                    break;
            }
        }
    }
});