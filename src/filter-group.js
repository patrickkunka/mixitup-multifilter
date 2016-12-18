/* global mixitup, h */

mixitup.FilterGroup = function() {
    this.name               = '';
    this.dom                = new mixitup.FilterGroupDom();
    this.activeSelectors    = [];
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
            controlEl       = h.closestParent(e.target, '[data-filter], [data-toggle]', true),
            controlSelector = '',
            index           = -1,
            selector        = '';

        if (!controlEl) return;

        if ((controlSelector = self.mixer.config.selectors.control) && !controlEl.matches(controlSelector)) {
            return;
        }

        e.stopPropagation();

        if (controlEl.matches('[data-filter]')) {
            selector = controlEl.getAttribute('data-filter');

            self.activeSelectors = [selector];
        } else if (controlEl.matches('[data-toggle]')) {
            selector = controlEl.getAttribute('data-toggle');

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
            case 'password':
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
            self.activeToggles   = [];
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
            attributeName   = '',
            selector        = '',
            value           = '';

        if (input.type.match(/text|search|password/g)) {
            attributeName = input.getAttribute('data-search-attribute');

            if (!attributeName) {
                throw new Error('[MixItUp MultiFilter] A valid `data-search-attribute` must be present on text inputs');
            }

            if (input.value.length < self.mixer.config.multifilter.minSearchLength) {
                self.activeSelectors = [''];

                return;
            }

            value = input.value.replace(/\W+/g, ' ').toLowerCase().trim();

            selector = '[' + attributeName + '*="' + value + '"]';
        } else {
            selector = input.value;
        }

        if (typeof input.value === 'string') {
            self.activeSelectors = [selector];
        }
    },

    /**
     * @private
     * @param   {HTMLELement} input
     * @return  {void}
     */

    getMultipleValues: function(input) {
        var self            = this,
            activeSelectors   = [],
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
                activeSelectors.push(item.value);
            }
        }

        if (self.logic === 'and') {
            // Compress into single node

            activeSelectors = [activeSelectors];
        }

        self.activeSelectors = activeSelectors;
    },

    /**
     * @private
     * @param   {Array.<HTMLELement>} [controlEls]
     * @param   {boolean}             [activateToggles]
     * @return  {void}
     */

    updateControls: function(controlEls, activateToggles) {
        var self        = this,
            controlEl   = null,
            type        = 'filter',
            i           = -1;

        controlEls = controlEls || self.dom.el.querySelectorAll('[data-filter], [data-toggle]');

        activateToggles = activateToggles || false;

        for (i = 0; controlEl = controlEls[i]; i++) {
            if (controlEl.getAttribute('data-toggle')) {
                type = 'toggle';
            }

            self.updateControl(controlEl, type, activateToggles);
        }
    },

    /**
     * @private
     * @param   {HTMLELement}   controlEl
     * @param   {string}        type
     * @param   {boolean}       [activateToggle]
     * @return  {void}
     */

    updateControl: function(controlEl, type, activateToggle) {
        var self            = this,
            selector        = controlEl.getAttribute('data-' + type),
            activeClassName = '';

        activeClassName = h.getClassname(self.mixer.config.classNames, type, self.mixer.config.classNames.modifierActive);

        if (self.activeSelectors.indexOf(selector) > -1) {
            h.addClass(controlEl, activeClassName);

            if (activateToggle) {
                self.activeToggles.push(selector);
            }
        } else {
            h.removeClass(controlEl, activeClassName);
        }
    },

    /**
     * @private
     */

    updateUi: function() {
        var self        = this,
            controlEls  = self.dom.el.querySelectorAll('[data-filter], [data-toggle]'),
            inputEls    = self.dom.el.querySelectorAll('input[type="radio"], input[type="checkbox"], option'),
            isActive    = false,
            inputEl     = null,
            i           = -1;

        if (controlEls.length) {
            self.activeToggles = [];

            self.updateControls(controlEls, true);
        }

        for (i = 0; inputEl = inputEls[i]; i++) {
            isActive = self.activeSelectors.indexOf(inputEl.value) > -1;

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