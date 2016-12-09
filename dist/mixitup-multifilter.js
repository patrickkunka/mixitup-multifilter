/**!
 * MixItUp MultiFilter v3.0.0-beta
 * A UI-builder for powerful multi-criteria filtering
 * Build b736311d-4e03-4955-8058-eb6e9f9fa545
 *
 * Requires mixitup.js >= v3.0.0
 *
 * @copyright Copyright 2014-2016 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://www.kunkalabs.com/mixitup-multifilter/
 *
 * @license   Commercial use requires a commercial license.
 *            https://www.kunkalabs.com/mixitup-multifilter/licenses/
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
                '[MixItUp Multifilter] MixItUp Multifilter v' +
                mixitupMultifilter.EXTENSION_VERSION +
                ' requires at least MixItUp v' +
                mixitupMultifilter.REQUIRE_CORE_VERSION
            );
        }

        /**
         * A group of properties defining the behavior of your multifilter UI.
         *
         * @constructor
         * @memberof    mixitup.Config
         * @name        multifilter
         * @namespace
         * @public
         * @since       3.0.0
         */

        mixitup.ConfigMultifilter = function() {

            /**
             * A boolean dictating whether or not to enable multifilter functionality.
             *
             * If `true`, MixItUp will query the DOM for any elements with a
             * `data-filter-group` attribute present on instantiation.
             *
             * @name        enable
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {boolean}
             * @default     false
             */

            this.enable = false;

            /**
             * A string dictating the logic to use when concatenating selectors within
             * individual filter groups.
             *
             * If set to `'or'` (default), targets will be shown if they match any
             * active filter in the group.
             *
             * If set to `'and'`, targets will be shown only if they match
             * all active filters in the group.
             *
             * @name        logicWithinGroup
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {string}
             * @default     'or'
             */

            this.logicWithinGroup = 'or';

            /**
             * A string dictating the logic to use when concatenating each group's
             * selectors into one single selector.
             *
             * If set to `'and'` (default), targets will be shown only if they match
             * the combined active selectors of all groups.
             *
             * If set to `'or'`, targets will be shown if they match the active selectors
             * of any individual group.
             *
             * @name        logicBetweenGroups
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {string}
             * @default     'and'
             */

            this.logicBetweenGroups = 'and';

            /**
             * An integer dictating the minimum number of characters at which the value
             * of a text input will be included as a multifilter. This prevents short or
             * incomplete words with many potential matches from triggering
             * filter operations.
             *
             * @name        minSearchLength
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {number}
             * @default     3
             */

            this.minSearchLength = 3;

            /**
             * A string dictating when the parsing of filter groups should occur.
             *
             * If set to `'change'` (default), the mixer will be filtered whenever the
             * filtering UI is interacted with. The mode provides real-time filtering with
             * instant feedback.
             *
             * If set to `'submit'`, the mixer will only be filtered when a submit button is
             * clicked (if using a `<form>` element as a parent). This enables the user to firstly
             * make their selection, and then trigger filtering once they have
             * finished making their selection.
             *
             * Alternatively, the `mixer.parseFilterGroups()` method can be called via the API at any
             * time to trigger the parsing of filter groups and filter the mixer.
             *
             * @name        parseOn
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {string}
             * @default     'change'
             */

            this.parseOn = 'change';

            /**
             * An integer dictating the duration in ms that must elapse between keyup
             * events in order to trigger a change.
             *
             * Setting a comfortable delay of ~350ms prevents the mixer from being
             * thrashed while typing occurs.
             *
             * @name        keyupThrottleDuration
             * @memberof    mixitup.Config.multifilter
             * @instance
             * @type        {number}
             * @default     350
             */

            this.keyupThrottleDuration = 350;

            h.seal(this);
        };

        /**
         * The MixItUp configuration object is extended with properties relating to
         * the MultiFilter extension.
         *
         * For the full list of configuration options, please refer to the MixItUp
         * core documentation.
         *
         * @constructor
         * @memberof    mixitup
         * @name        Config
         * @namespace
         * @public
         * @since       2.0.0
         */

        mixitup.Config.registerAction('beforeConstruct', 'multifilter', function() {
            this.multifilter = new mixitup.ConfigMultifilter();
        });

        mixitup.MultifilterFormEventTracker = function() {
            this.form           = null;
            this.totalBound     = 0;
            this.totalHandled   = 0;

            h.seal(this);
        };

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

                e.preventDefault();

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
                    selector        = '';

                if (input.type.match(/text|search|password/g)) {
                    attributeName = input.getAttribute('data-search-attribute');

                    if (!attributeName) {
                        throw new Error('[MixItUp] A valid `data-search-attribute` must be present on text inputs');
                    }

                    if (input.value.length < self.mixer.config.multifilter.minSearchLength) {
                        self.activeSelectors = [''];

                        return;
                    }

                    selector = '[' + attributeName + '*="' + input.value + '"]';
                } else {
                    selector = input.value;
                }

                if (input.value) {
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
             * @return  {void}
             */

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

            /**
             * @private
             * @param   {HTMLELement}   controlEl
             * @param   {string}        type
             * @return  {void}
             */

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

        mixitup.MixerDom.registerAction('afterConstruct', 'multifilter', function() {
            this.filterGroups = [];
        });

        /**
         * The `mixitup.Mixer` class is extended with API methods relating to
         * the MultiFilter extension.
         *
         * For the full list of API methods, please refer to the MixItUp
         * core documentation.
         *
         * @constructor
         * @namespace
         * @name        Mixer
         * @memberof    mixitup
         * @public
         * @since       3.0.0
         */

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
            self.config.multifilter.logicWithinGroup = self.config.multifilter.logicWithinGroup.toLowerCase().trim();
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

        mixitup.Mixer.registerAction('beforeDestory', 'multifilter', function() {
            var self    = this,
                group   = null,
                i       = -1;

            for (i = 0; group = self.filterGroups[i]; i++) {
                group.unbindEvents();
            }
        });

        mixitup.Mixer.extend(
        /** @lends mixitup.Mixer */
        {
            /**
             * @private
             * @return {void}
             */

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

            /**
             * @private
             * @instance
             * @since   2.0.0
             * @param   {Array<*>}  args
             * @return  {mixitup.UserInstruction}
             */

            parseParseFilterGroupsArgs: function(args) {
                var self        = this,
                    instruction = new mixitup.UserInstruction(),
                    arg         = null,
                    i           = -1;

                instruction.animate = self.config.animation.enable;
                instruction.command = new mixitup.CommandFilter();

                for (i = 0; i < args.length; i++) {
                    arg = args[i];

                    if (typeof arg === 'boolean') {
                        instruction.animate = arg;
                    } else if (typeof arg === 'function') {
                        instruction.callback = arg;
                    }
                }

                h.freeze(instruction);

                return instruction;
            },

            /**
             * Traverses the currently active filters in all groups, building up a
             * compound selector string as per the defined logic. A filter operation
             * is then called on the mixer using the generated selector.
             *
             * This method can be used to programmatically trigger the parsing of
             * filter groups after manipulations to the UI which would not otherwise
             * trigger a `change` automatically.
             *
             * @example
             *
             * .parseFilterGroups([animate] [, callback])
             *
             * @example <caption>Example: Triggering parsing after manually selecting all checkboxes in a group</caption>
             *
             * var checkboxes = Array.from(document.querySelectorAll('.my-group > input[type="checkbox"]'));
             *
             * checkboxes.forEach(function(checkbox) {
             *     checkbox.checked = true;
             * });
             *
             * mixer.parseFilterGroups();
             *
             * @public
             * @param       {boolean}   [animate=true]
             *      An optional boolean dictating whether the operation should animate, or occur syncronously with no animation. `true` by default.
             * @param       {function}  [callback=null]
             *      An optional callback function to be invoked after the operation has completed.
             * @return      {Promise.<mixitup.State>}
             *      A promise resolving with the current state object.
             */

            parseFilterGroups: function() {
                var self        = this,
                    instruction = self.parseFilterArgs(arguments),
                    paths       = self.getFilterGroupPaths(),
                    selector    = self.buildSelectorFromPaths(paths);

                if (selector === '') {
                    selector = self.config.controls.toggleDefault;
                }

                instruction.command.selector = selector;

                return self.multimix({
                    filter: instruction.command
                }, instruction.animate, instruction.callback);
            },

            /**
             * Recursively builds up paths between all possible permutations
             * of filter group nodes according to the defined logic.
             *
             * @private
             * @return {Array.<Array.<string>>}
             */

            getFilterGroupPaths: function() {
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

            /**
             * Builds up a selector string from a provided paths array.
             *
             * @private
             * @param  {Array.<Array.<string>>} paths
             * @return {string}
             */

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

        mixitup.Facade.registerAction('afterConstruct', 'multifilter', function(mixer) {
            this.parseFilterGroups = mixer.parseFilterGroups.bind(mixer);
        });    };

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
        throw new Error('[MixItUp MultiFilter] MixItUp core not found');
    }})(window);