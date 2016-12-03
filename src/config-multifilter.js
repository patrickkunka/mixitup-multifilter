/* global mixitup, h */

mixitup.ConfigMultifilter = function() {
    this.enable             = false;
    this.logicWithinGroup   = 'or';
    this.logicBetweenGroups = 'and';
    this.minSearchLength    = 3;

    h.seal(this);
};