/* global mixitup */

mixitup.Facade.registerAction('afterConstruct', 'multifilter', function(mixer) {
    this.parseFilterGroups       = mixer.parseFilterGroups.bind(mixer);
    this.setFilterGroupSelectors = mixer.setFilterGroupSelectors.bind(mixer);
    this.getFilterGroupSelectors = mixer.getFilterGroupSelectors.bind(mixer);
});