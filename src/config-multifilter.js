/* global mixitup, h */

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