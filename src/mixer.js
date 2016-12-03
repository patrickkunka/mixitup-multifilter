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
     * Traverses currently active filters in all groups, building up a
     * compound selector string as per the defined logic. A filter operation
     * is then called on the mixer using the selector.
     *
     * This method can be used to programmatically trigger the parsing of
     * filter groups after a manipulation of active filters which would not
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