/* global mixitup */

mixitup.Config.registerAction('beforeConstruct', 'multifilter', function() {
    this.multifilter = new mixitup.ConfigMultifilter();
});