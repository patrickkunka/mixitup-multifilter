/**!
 * MixItUp MultiFilter v3.0.0-beta
 *
 * Requires mixitup.js >= v3.0.0
 *
 * @copyright Copyright 2014-2016 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://www.kunkalabs.com/mixitup-pagination/
 *
 * @license   Commercial use requires a commercial license.
 *            https://www.kunkalabs.com/mixitup-pagination/licenses/
 *
 *            Non-commercial use permitted under same terms as  license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function(window) {
    'use strict';

    var mixitupMultifilter = function(mixitup) {
        var h = mixitup.h;

        if (
            !mixitup.CORE_VERSION ||
            !h.compareVersions(mixitupMultifilter.REQUIRE_CORE_VERSION, mixitup.CORE_VERSION)
        ) {
            throw new Error(
                '[MixItUp-Multifilter] MixItUp Pagination v' +
                mixitupMultifilter.EXTENSION_VERSION +
                ' requires at least MixItUp v' +
                mixitupMultifilter.REQUIRE_CORE_VERSION
            );
        }

        // config

        mixitup.ConfigMultifilter = function() {
            this.enable             = false;
            this.logicWithinGroup   = 'or';
            this.logicBetweenGroups = 'and';
            this.minSearchLength    = 3;
        };

        mixitup.Config.registerAction('beforeConstruct', 'multifilter', function() {
            this.multifilter = new mixitup.ConfigMultifilter();
        });

        // dom

        mixitup.MixerDom.registerAction('afterConstruct', 'multifilter', function() {
            this.filterGroups = [];
        });

        // mixer

        mixitup.Mixer.registerAction('afterConstruct', 'multifilter', function() {
            this.filterGroups               = [];
            this.multifilterFormEventTracker    = null;
        });

        mixitup.Mixer.registerAction('afterCacheDom', 'multifilter', function() {
            var self    = this,
                parent  = null;

            if (!self.config.multifilter.enable) return;

            switch (self.config.controls.scope) {
                case 'local':
                    parent = self.dom.container;

                    break;
                case 'global':
                    parent = self.dom.document;

                    break;
                default:
                    throw new Error(mixitup.messages.ERROR_CONFIG_INVALID_CONTROLS_SCOPE);
            }

            self.dom.filterGroups = parent.querySelectorAll('[data-filter-group]');
        });

        mixitup.Mixer.registerAction('beforeInitControls', 'multifilter', function() {
            var self = this;

            if (!self.config.multifilter.enable) return;

            self.config.controls.live = true; // force live controls if multifilter is enabled
        });

        mixitup.Mixer.registerAction('afterSanitizeConfig', 'multifilter', function() {
            var self = this;

            self.config.multifilter.logicBetweenGroups = self.config.multifilter.logicBetweenGroups.toLowerCase().trim();
            self.config.multifilter.logicWithinGroups = self.config.multifilter.logicWithinGroups.toLowerCase().trim();
        });

        mixitup.Mixer.registerAction('afterAttach', 'multifilter', function() {
            var self = this;

            if (self.dom.filterGroups.length) {
                self.indexFilterGroups();
            }
        });

        mixitup.Mixer.registerAction('afterUpdateControls', 'multifilter', function() {
            var self    = this,
                group   = null,
                i       = -1;

            for (i = 0; group = self.filterGroups[i]; i++) {
                group.updateControls();
            }
        });

        mixitup.Mixer.extend(
        /** @lends mixitup.Mixer */
        {
            indexFilterGroups: function() {
                var self          = this,
                    filterGroup   = null,
                    el            = null,
                    i             = -1;

                for (i = 0; el = self.dom.filterGroups[i]; i++) {
                    filterGroup = new mixitup.FilterGroup();

                    filterGroup.init(el, self);

                    self.filterGroups.push(filterGroup);
                }
            },

            parseMultifilters: function() {
                var self        = this,
                    paths       = self.getMultifilterPaths(),
                    selector    = self.buildSelectorFromPaths(paths);

                if (selector === '') {
                    selector = self.config.controls.toggleDefault;
                }

                return self.filter(selector);
            },

            getMultifilterPaths: function() {
                var self       = this,
                    buildPath  = null,
                    crawl      = null,
                    nodes      = null,
                    matrix     = [],
                    paths      = [],
                    trackers   = [],
                    i          = -1;

                for (i = 0; i < self.filterGroups.length; i++) {
                    // Filter out groups without any active filters

                    if ((nodes = self.filterGroups[i].activeSelectors).length) {
                        matrix.push(nodes);

                        // Initialise tracker for each group

                        trackers.push(0);
                    }
                }

                buildPath = function() {
                    var node            = null,
                        path            = [],
                        i               = -1;

                    for (i = 0; i < matrix.length; i++) {
                        node = matrix[i][trackers[i]];

                        if (Array.isArray(node)) {
                            // AND logic within group

                            node = node.join('');
                        }

                        path.push(node);
                    }

                    path = h.clean(path);

                    paths.push(path);
                };

                crawl = function(index) {
                    index = index || 0;

                    var nodes = matrix[index];

                    while (trackers[index] < nodes.length) {
                        if (index < matrix.length - 1) {
                            // If not last, recurse

                            crawl(index + 1);
                        } else {
                            // Last, build selector

                            buildPath();
                        }

                        trackers[index]++;
                    }

                    trackers[index] = 0;
                };

                if (!matrix.length) return '';

                crawl();

                return paths;
            },

            buildSelectorFromPaths: function(paths) {
                var self           = this,
                    path           = null,
                    output         = [],
                    pathSelector   = '',
                    nodeDelineator = '',
                    i              = -1;

                if (!paths.length) {
                    return '';
                }

                if (self.config.multifilter.logicBetweenGroups === 'or') {
                    nodeDelineator = ', ';
                }

                if (paths.length > 1) {
                    for (i = 0; i < paths.length; i++) {
                        path = paths[i];

                        pathSelector = path.join(nodeDelineator);

                        if (output.indexOf(pathSelector) < 0) {
                            output.push(pathSelector);
                        }
                    }

                    return output.join(', ');
                } else {
                    return paths[0].join(nodeDelineator);
                }
            }
        });

        mixitup.MultifilterFormEventTracker = function() {
            this.form           = null;
            this.totalBound     = 0;
            this.totalHandled   = 0;

            h.seal(this);
        };

        // FilterGroup

        mixitup.FilterGroupDom = function() {
            this.el     = null;
            this.form   = null;

            h.seal(this);
        };

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
                var self    = this,
                    logic   = el.getAttribute('data-logic');

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
    };

    mixitupMultifilter.TYPE                    = 'mixitup-extension';
    mixitupMultifilter.NAME                    = 'mixitup-multifilter';
    mixitupMultifilter.EXTENSION_VERSION       = '3.0.0-beta';
    mixitupMultifilter.REQUIRE_CORE_VERSION    = '3.0.0';

    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = mixitupMultifilter;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return mixitupMultifilter;
        });
    } else if (window.mixitup && typeof window.mixitup === 'function') {
        mixitupMultifilter(window.mixitup);
    } else {
        throw new Error('[MixItUp-Multifilter] MixItUp core not found');
    }
})(window);