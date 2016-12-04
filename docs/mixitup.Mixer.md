# mixitup.Mixer

## Overview

The `mixitup.Mixer` class is extended with API methods relating to
the MultiFilter extension.

For the full list of API methods, please refer to the MixItUp
core documentation.

### Contents

- [parseFilterGroups()](#parseFilterGroups)


<h3 id="parseFilterGroups">parseFilterGroups()</h3>


`.parseFilterGroups([animate] [, callback])`

Traverses the currently active filters in all groups, building up a
compound selector string as per the defined logic. A filter operation
is then called on the mixer using the generated selector.

This method can be used to programmatically trigger the parsing of
filter groups after manipulations to the UI which would not otherwise
trigger a `change` automatically.

|   |Type | Name | Description
|---|--- | --- | ---
|Param   |`boolean` | `[animate]` | An optional boolean dictating whether the operation should animate, or occur syncronously with no animation. `true` by default.
|Param   |`function` | `[callback]` | An optional callback function to be invoked after the operation has completed.
|Returns |`Promise.<mixitup.State>` | A promise resolving with the current state object.


###### Example: Triggering parsing after manually selecting all checkboxes in a group

```js

var checkboxes = Array.from(document.querySelectorAll('.my-group > input[type="checkbox"]'));

checkboxes.forEach(function(checkbox) {
    checkbox.checked = true;
});

mixer.parseFilterGroups();
```

