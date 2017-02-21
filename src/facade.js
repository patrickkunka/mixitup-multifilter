/* global mixitup */

mixitup.Facade.registerAction('afterConstruct', 'multifilter', function(mixer) {
    this.parseFilterGroups              = mixer.parseFilterGroups.bind(mixer);
    this.parseFilterGroupsToSelector    = mixer.parseFilterGroupsToSelector.bind(mixer);
    this.setFilterGroupSelectors        = mixer.setFilterGroupSelectors.bind(mixer);
    this.getFilterGroupSelectors        = mixer.getFilterGroupSelectors.bind(mixer);
});