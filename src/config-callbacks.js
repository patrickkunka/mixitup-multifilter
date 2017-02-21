/* global mixitup */

/**
 * A group of optional callback functions to be invoked at various
 * points within the lifecycle of a mixer operation.
 *
 * @constructor
 * @memberof    mixitup.Config
 * @name        callbacks
 * @namespace
 * @public
 * @since       3.0.0
 */

mixitup.ConfigCallbacks.registerAction('afterConstruct', 'multifilter', function() {
    /**
     * A callback function invoked whenever MultiFilter filter groups
     * are parsed. This occurs whenever the user interacts with filter
     * group UI, or when the `parseFilterGroups()` API method is called,
     * but before the resulting filter operation has been triggered.
     *
     * By default, this generates the appropriate compound selector and
     * filters the mixer using a `multimix()` API call internally. This
     * callback can be used to transform the multimix command object sent
     * to this API call.
     *
     * This is particularly useful when additional behavior such as sorting
     * or pagination must be taken into account when using the MultiFilter API.
     *
     * The callback receives the generated multimix command object, and must
     * also return a valid multimix command object.
     *
     * @example <caption>Example: Overriding the default filtering behavior with `onParseFilterGroups`</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onParseFilterGroups: function(command) {
     *             command.paginate = 3;
     *             command.sort = 'default:desc';
     *
     *             return command;
     *         }
     *     }
     * });
     *
     * @name        onParseFilterGroups
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onParseFilterGroups = null;
});