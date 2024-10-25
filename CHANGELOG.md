Change Log
==========

## 3.3.7
- Non run-time changes to licensing and distribution model

## 3.3.6
- Fixes a bug accidentally introduced in v3.3.5 which resulted in a fatal exception on initialisation when using "programmatic filtering by URL" and fieldsets with `<input>` elements within them.

## 3.3.5
- Fixes a bug that prevented `.getFilterGroupSelectors()` from returning any values when using data-filter controls.

## 3.3.4
- Fixes a bug whereby filters within a group where not deactivated when toggles in the same group were activated.
- Adds a new demo "Filter and Toggle Controls" to demonstrate functionality.

## 3.3.3
- Fixes a bug causing filter controls to be treated like toggle controls when in a mixed field group.

## 3.3.2

- Implements diacritics replacement of input value when searching by text input (e.g. "é" -> "e"). Allows loose matching of accented characters when searching providing an equivalent server-side operation is done to all values present in the HTML.

## 3.3.1

- Fixes issue where a `<select>` element with no selected value yields an array with an empty string when querying its value via `.getFilterGroupSelectors()`.
- Fixes issue where `onMixClick` callback was not invoked for MultiFilter filter or toggle controls.
- Adds a new "Programmatic Filtering by URL" demo with Pagination compatibility.
- Updates previous versions of "Programmatic Filtering by URL" demo to use `history.replaceState()` rather than `history.pushState()`.

## 3.3.0

- Adds a new callback method `onParseFilterGroups()`, enabling transformation of the resulting multimix command.
- Fixes issue introduced in 3.2.1 regarding "keyup" events from legitimate text inputs not being handled.

## 3.2.1

- Fixes an issue where the "active" class name was not added to toggles if "and" logic was used within a group.
- Fixes an issue where "keyup" events from non-textual inputs (i.e. multiselect) were unintentionally handled and fired filter operations.

## 3.2.0

- Adds `.setFilterGroupSelectors()` and `.getFilterGroupSelectors()` methods to allow multi dimensional filtering
and programmatic control of the UI via the API.


## 3.1.2

- Bumps core dependency to 3.1.2, improves version comparison functionality.


## 3.1.1

- Fixes an issue where empty string values in `<select>` elements were ignored.

## 3.1.0

- Integrates with `selectors.controls` configuration option added to MixItUp core 3.1.0 to add specificity to control
selectors and prevent interference by third-party markup which may share the mandatory control data attributes.

## 3.0.3

- Trims and removes non-alphanumeric characters from text input values before selector generation. Adds text inputs demo.

## 3.0.2

- Makes text input searching case-insensitive by converting to lowercase before selector generation.

## 3.0.1

- Fixes issue where e.preventDefault() was called on reset events preventing reset functionality. Many additional demos added.

## 3.0.0

- Release











