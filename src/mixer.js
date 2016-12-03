/* global mixitup, h */

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

    parseFilterGroups: function() {
        var self        = this,
            paths       = self.getFilterGroupPaths(),
            selector    = self.buildSelectorFromPaths(paths);

        if (selector === '') {
            selector = self.config.controls.toggleDefault;
        }

        return self.filter(selector);
    },

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