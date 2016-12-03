/* global mixitup */

mixitup.Facade.registerAction('afterConstruct', 'pagination', function(mixer) {
    this.parseFilterGroups = mixer.parseFilterGroups.bind(mixer);
});