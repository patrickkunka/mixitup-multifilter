/* global mixitup, h */

mixitup.MultifilterFormEventTracker = function() {
    this.form           = null;
    this.totalBound     = 0;
    this.totalHandled   = 0;

    h.seal(this);
};