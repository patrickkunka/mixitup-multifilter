/* global mixitupMultifilter */

if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = mixitupMultifilter;
} else if (typeof define === 'function' && define.amd) {
    define(function() {
        return mixitupMultifilter;
    });
} else if (window.mixitup && typeof window.mixitup === 'function') {
    mixitupMultifilter(window.mixitup);
} else {
    throw new Error('[MixItUp MultiFilter] MixItUp core not found');
}