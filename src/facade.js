/* global mixitup */

mixitup.Facade.registerAction('afterConstruct', 'multifilter', function(mixer) {
    this.parseFilterGroups = mixer.parseFilterGroups.bind(mixer);
});