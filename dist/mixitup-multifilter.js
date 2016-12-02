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
            this.multifilter    = new mixitup.ConfigMultifilter();
        });

        // dom

        mixitup.MixerDom.registerAction('afterConstruct', 'multifilter', function() {
            this.filterGroups = [];
        });

        // mixer

        mixitup.Mixer.registerAction('afterConstruct', 'multifilter', function() {
            this.filterGroups = [];
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

        mixitup.Mixer.registerAction('afterAttach', 'multifilter', function() {
            var self = this;

            if (self.dom.filterGroups.length) {
                self.indexFilterGroups();
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
                    filterGroup = new mixitup.filterGroup();

                    filterGroup.init(el, self);

                    self.filterGroups.push(filterGroup);
                }
            },

            parseFilterGroups: function() {
                var self              = this,
                    buildSelector     = null,
                    crawl             = null,
                    activeFilters     = null,
                    matrix            = [],
                    compoundSelectors = [],
                    trackers          = [],
                    i                 = -1;

                for (i = 0; i < self.filterGroups.length; i++) {
                    // Filter out groups without any active filters

                    if ((activeFilters = self.filterGroups[i].activeFilters).length) {
                        matrix.push(activeFilters);

                        // Initialise tracker for each group

                        trackers.push(0);
                    }
                }

                buildSelector = function() {
                    var i = -1,
                        compoundSelector = [];

                    for (i = 0; i < matrix.length; i++) {
                        compoundSelector.push(matrix[i][trackers[i]]);
                    }

                    compoundSelectors.push(compoundSelector.join(''));
                };

                crawl = function(index) {
                    index = index || 0;

                    var activeFilters = matrix[index],
                        i = 0;

                    while (trackers[index] < activeFilters.length) {
                        if (index < matrix.length - 1) {
                            // If not last, recurse

                            crawl(index + 1);
                        } else {
                            // Last, build selector

                            buildSelector();
                        }

                        trackers[index]++;
                    }

                    trackers[index] = 0;
                };

                if (!matrix.length) return '';

                crawl();

                return compoundSelectors.join(', ');
            }
        });

        mixitup.filterGroup = function() {
            this.el             = null;
            this.activeFilters  = [];
            this.handler        = null;
            this.mixer          = null;
        };

        h.extend(mixitup.filterGroup.prototype, {
            init: function(el, mixer) {
                this.el = el;
                this.mixer = mixer;

                this.bindEvents();
            },

            bindEvents: function() {
                var self = this;

                self.handler = function(e) {
                    switch (e.type) {
                        case 'click':
                            self.handleClick(e);

                            break;
                        case 'change':
                            self.handleChange(e);

                            break;
                    }
                };

                h.on(self.el, 'click', self.handler);
                h.on(self.el, 'change', self.handler);
            },

            unbindEvents: function() {
                var self = this;

                h.off(self.el, 'click', self.handler);
                h.off(self.el, 'change', self.handler);

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

                    self.activeFilters = [selector];
                } else if (controlEl.matches('[data-toggle]')) {
                    selector = controlEl.getAttribute('data-toggle');

                    if ((index = self.activeFilters.indexOf(selector)) > -1) {
                        self.activeFilters.splice(index, 1);
                    } else {
                        self.activeFilters.push(selector);
                    }
                }

                console.log(self.mixer.parseFilterGroups());
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

                console.log(self.mixer.parseFilterGroups());
            },

            getSingleValue: function(input) {
                var self = this;

                if (input.value) {
                    self.activeFilters = [input.value];
                }
            },

            getMultipleValues: function(input) {
                var self            = this,
                    activeFilters   = [],
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

                items = self.el.querySelectorAll(query);

                for (i = 0; item = items[i]; i++) {
                    if ((item.checked || item.selected) && item.value) {
                        activeFilters.push(item.value);
                    }
                }

                self.activeFilters = activeFilters;
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