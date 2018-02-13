# mixitup.Mixer

## Overview

The `mixitup.Mixer` class is extended with API methods relating to
the MultiFilter extension.

For the full list of API methods, please refer to the MixItUp
core documentation.

### Contents

- [parseFilterGroups()](#parseFilterGroups)
- [setFilterGroupSelectors()](#setFilterGroupSelectors)
- [getFilterGroupSelectors()](#getFilterGroupSelectors)


<h3 id="parseFilterGroups">parseFilterGroups()</h3>

*Version added: 3.0.0*

`.parseFilterGroups([animate] [, callback])`

Traverses the currently active filters in all groups, building up a
compound selector string as per the defined logic. A filter operation
is then called on the mixer using the resulting selector.

This method can be used to programmatically trigger the parsing of
filter groups after manipulations to a group's active selector(s) by
the `.setFilterGroupSelectors()` API method.

|   |Type | Name | Description
|---|--- | --- | ---
|Param   |`boolean` | `[animate]` | An optional boolean dictating whether the operation should animate, or occur syncronously with no animation. `true` by default.
|Param   |`function` | `[callback]` | An optional callback function to be invoked after the operation has completed.
|Returns |`Promise.<mixitup.State>` | A promise resolving with the current state object.


###### Example: Triggering parsing after programmatically changing the values of a filter group

```js

mixer.setFilterGroupSelectors('color', ['.green', '.blue']);

mixer.parseFilterGroups();
```

<h3 id="setFilterGroupSelectors">setFilterGroupSelectors()</h3>

*Version added: 3.2.0*

`.setFilterGroupSelectors(groupName, selectors)`

Programmatically sets one or more active selectors for a specific filter
group and updates the group's UI.

Because MixItUp has no way of knowing how to break down a provided
compound selector into its component groups, we can not use the
standard `.filter()` or `toggleOn()/toggleOff()` API methods when using
the MultiFilter extension. Instead, this method allows us to perform
multi-dimensional filtering via the API by setting the active selectors of
individual groups and then triggering the `.parseFilterGroups()` method.

If setting multiple active selectors, do not pass a compound selector.
Instead, pass an array with each item containing a single selector
string as in example 2.

|   |Type | Name | Description
|---|--- | --- | ---
|Param   |`string` | `groupName` | The name of the filter group as defined in the markup via the `data-filter-group` attribute.
|Param   |`string, Array.<string>` | `selectors` | A single selector string, or multiple selector strings as an array.
|Returns |`void` | 


###### Example 1: Setting a single active selector for a "color" group

```js

mixer.setFilterGroupSelectors('color', '.green');

mixer.parseFilterGroups();
```
###### Example 2: Setting multiple active selectors for a "size" group

```js

mixer.setFilterGroupSelectors('size', ['.small', '.large']);

mixer.parseFilterGroups();
```

<h3 id="getFilterGroupSelectors">getFilterGroupSelectors()</h3>

*Version added: 3.2.0*

`.getFilterGroupSelectors(groupName)`

Returns an array of active selectors for a specific filter group.

|   |Type | Name | Description
|---|--- | --- | ---
|Param   |`string` | `groupName` | The name of the filter group as defined in the markup via the `data-filter-group` attribute.
|Returns |`void` | 


###### Example: Retrieving the active selectors for a "size" group

```js

mixer.getFilterGroupSelectors('size'); // ['.small', '.large']
```

