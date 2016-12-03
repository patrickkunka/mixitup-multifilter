/* global mixitup, h */

mixitup.FilterGroup = function() {
    this.dom                = new mixitup.FilterGroupDom();
    this.activeSelectors    = [];
    this.activeToggles      = [];
    this.handler            = null;
    this.mixer              = null;
    this.logic              = 'or';
    this.parseOn            = 'change';

    h.seal(this);
};

h.extend(mixitup.FilterGroup.prototype, {
    init: function(el, mixer) {
        var self  = this,
            logic = el.getAttribute('data-logic');

        self.dom.el = el;

        self.cacheDom();

        self.mixer = mixer;

        if ((logic && logic.toLowerCase() === 'and') || mixer.config.multifilter.logicWithinGroup === 'and') {
            // override default group logic

            self.logic = 'and';
        }

        self.bindEvents();
    },

    cacheDom: function() {
        var self = this;

        self.dom.form = h.closestParent(self.dom.el, 'form');
    },

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

        if (self.dom.form) {
            h.on(self.dom.form, 'reset', self.handler);
            h.on(self.dom.form, 'submit', self.handler);
        }
    },

    unbindEvents: function() {
        var self = this;

        h.off(self.dom.el, 'click', self.handler);
        h.off(self.dom.el, 'change', self.handler);

        if (self.dom.form) {
            h.off(self.dom.form, 'reset', self.handler);
            h.off(self.dom.form, 'submit', self.handler);
        }

        self.handler = null;
    },

    handleClick: function(e) {
        var self       = this,
            controlEl  = h.closestParent(e.target, '[data-filter], [data-toggle]', true),
            index      = -1,
            selector   = '';

        if (!controlEl) return;

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
            self.mixer.parseMultifilters();
        }
    },

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
            self.mixer.parseMultifilters();
        }
    },

    handleFormEvent: function(e) {
        var self            = this,
            tracker         = null,
            group           = null,
            i               = -1;

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

                if (self.mixer.config.multifilter.parseOn === 'change') {
                    self.mixer.parseMultifilters();
                }
            }
        }
    },

    getSingleValue: function(input) {
        var self = this;

        if (input.value) {
            self.activeSelectors = [input.value];
        }
    },

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

    updateControls: function() {
        var self        = this,
            controlsEls = self.dom.el.querySelectorAll('[data-filter], [data-toggle]'),
            controlEl   = null,
            type        = 'filter',
            i           = -1;

        for (i = 0; controlEl = controlsEls[i]; i++) {
            if (controlEl.getAttribute('data-toggle')) {
                type = 'toggle';
            }

            self.updateControl(controlEl, type);
        }
    },

    updateControl: function(controlEl, type) {
        var self            = this,
            selector        = controlEl.getAttribute('data-' + type),
            activeClassName = '';

        activeClassName = h.getClassname(self.mixer.config.classNames, type, self.mixer.config.classNames.modifierActive);

        if (self.activeSelectors.indexOf(selector) > -1) {
            h.addClass(controlEl, activeClassName);
        } else {
            h.removeClass(controlEl, activeClassName);
        }
    }
});