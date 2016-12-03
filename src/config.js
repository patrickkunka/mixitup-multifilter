/* global mixitup */

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