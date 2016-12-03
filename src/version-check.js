/* global mixitupMultifilter, mixitup, h */

if (
    !mixitup.CORE_VERSION ||
    !h.compareVersions(mixitupMultifilter.REQUIRE_CORE_VERSION, mixitup.CORE_VERSION)
) {
    throw new Error(
        '[MixItUp Multifilter] MixItUp Multifilter v' +
        mixitupMultifilter.EXTENSION_VERSION +
        ' requires at least MixItUp v' +
        mixitupMultifilter.REQUIRE_CORE_VERSION
    );
}