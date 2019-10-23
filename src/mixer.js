/* global mixitup, h */

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
    this.filterGroups                   = [];
    this.filterGroupsHash               = {};
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

mixitup.Mixer.registerAction('beforeDestroy', 'multifilter', function() {
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
        var self                = this,
            filterGroup         = null,
            el                  = null,
            i                   = -1;

        for (i = 0; el = self.dom.filterGroups[i]; i++) {
            filterGroup = new mixitup.FilterGroup();

            filterGroup.init(el, self);

            self.filterGroups.push(filterGroup);

            if (filterGroup.name) {
                // If present, also index by name

                if (typeof self.filterGroupsHash[filterGroup.name] !== 'undefined') {
                    throw new Error('[MixItUp MultiFilter] A filter group with name "' + filterGroup.name + '" already exists');
                }

                self.filterGroupsHash[filterGroup.name] = filterGroup;
            }
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
            var node = null,
                path = [],
                i    = -1;

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
    },

    /**
     * Traverses the currently active filters in all groups, building up a
     * compound selector string as per the defined logic. A filter operation
     * is then called on the mixer using the resulting selector.
     *
     * This method can be used to programmatically trigger the parsing of
     * filter groups after manipulations to a group's active selector(s) by
     * the `.setFilterGroupSelectors()` API method.
     *
     * @example
     *
     * .parseFilterGroups([animate] [, callback])
     *
     * @example <caption>Example: Triggering parsing after programmatically changing the values of a filter group</caption>
     *
     * mixer.setFilterGroupSelectors('color', ['.green', '.blue']);
     *
     * mixer.parseFilterGroups();
     *
     * @public
     * @since 3.0.0
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
            selector    = self.buildSelectorFromPaths(paths),
            callback    = null,
            command     = {};

        if (selector === '') {
            selector = self.config.controls.toggleDefault;
        }

        instruction.command.selector = selector;

        command.filter = instruction.command;

        if (typeof (callback = self.config.callbacks.onParseFilterGroups) === 'function') {
            command = callback(command);
        }

        return self.multimix(command, instruction.animate, instruction.callback);
    },

    /**
     * Programmatically sets one or more active selectors for a specific filter
     * group and updates the group's UI.
     *
     * Because MixItUp has no way of knowing how to break down a provided
     * compound selector into its component groups, we can not use the
     * standard `.filter()` or `toggleOn()/toggleOff()` API methods when using
     * the MultiFilter extension. Instead, this method allows us to perform
     * multi-dimensional filtering via the API by setting the active selectors of
     * individual groups and then triggering the `.parseFilterGroups()` method.
     *
     * If setting multiple active selectors, do not pass a compound selector.
     * Instead, pass an array with each item containing a single selector
     * string as in example 2.
     *
     * @example
     *
     * .setFilterGroupSelectors(groupName, selectors)
     *
     * @example <caption>Example 1: Setting a single active selector for a "color" group</caption>
     *
     * mixer.setFilterGroupSelectors('color', '.green');
     *
     * mixer.parseFilterGroups();
     *
     * @example <caption>Example 2: Setting multiple active selectors for a "size" group</caption>
     *
     * mixer.setFilterGroupSelectors('size', ['.small', '.large']);
     *
     * mixer.parseFilterGroups();
     *
     * @public
     * @since   3.2.0
     * @param   {string}                    groupName   The name of the filter group as defined in the markup via the `data-filter-group` attribute.
     * @param   {(string|Array.<string>)}   selectors   A single selector string, or multiple selector strings as an array.
     * @return  {void}
     */

    setFilterGroupSelectors: function(groupName, selectors) {
        var self            = this,
            filterGroup     = null;

        selectors = Array.isArray(selectors) ? selectors : [selectors];

        if (typeof (filterGroup = self.filterGroupsHash[groupName]) === 'undefined') {
            throw new Error('[MixItUp MultiFilter] No filter group could be found with the name "' + groupName + '"');
        }

        filterGroup.activeToggles = selectors.slice();

        if (filterGroup.logic === 'and') {
            // Compress into single node

            filterGroup.activeSelectors = [filterGroup.activeToggles];
        } else {
            filterGroup.activeSelectors = filterGroup.activeToggles;
        }

        filterGroup.updateUi(filterGroup.activeToggles);
    },

    /**
     * Returns an array of active selectors for a specific filter group.
     *
     * @example
     *
     * .getFilterGroupSelectors(groupName)
     *
     * @example <caption>Example: Retrieving the active selectors for a "size" group</caption>
     *
     * mixer.getFilterGroupSelectors('size'); // ['.small', '.large']
     *
     * @public
     * @since   3.2.0
     * @param   {string}    groupName   The name of the filter group as defined in the markup via the `data-filter-group` attribute.
     * @return  {void}
     */

    getFilterGroupSelectors: function(groupName) {
        var self        = this,
            filterGroup = null;

        if (typeof (filterGroup = self.filterGroupsHash[groupName]) === 'undefined') {
            throw new Error('[MixItUp MultiFilter] No filter group could be found with the name "' + groupName + '"');
        }

        return filterGroup.activeSelectors.slice();
    }
});