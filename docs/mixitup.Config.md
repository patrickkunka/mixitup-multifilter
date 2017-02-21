# mixitup.Config

## Overview

The MixItUp configuration object is extended with properties relating to
the MultiFilter extension.

For the full list of configuration options, please refer to the MixItUp
core documentation.

### Contents

- [callbacks](#callbacks)
- [multifilter](#multifilter)


<h2 id="callbacks">callbacks</h2>

A group of optional callback functions to be invoked at various
points within the lifecycle of a mixer operation.

### onParseFilterGroups




A callback function invoked whenever MultiFilter filter groups
are parsed. This occurs whenever the user interacts with filter
group UI, or when the `parseFilterGroups()` API method is called,
but before the resulting filter operation has been triggered.

By default, this generates the appropriate compound selector and
filters the mixer using a `multimix()` API call internally. This
callback can be used to transform the multimix command object sent
to this API call.

This is particularly useful when additional behavior such as sorting
or pagination must be taken into account when using the MultiFilter API.

The callback receives the generated multimix command object, and must
also return a valid multimix command object.


|Type | Default
|---  | ---
|`function`| `null`

###### Example: Overriding the default filtering behavior with `onParseFilterGroups`

```js
var mixer = mixitup(containerEl, {
    callbacks: {
        onParseFilterGroups: function(command) {
            command.paginate = 3;
            command.sort = 'default:desc';

            return command;
        }
    }
});
```

<h2 id="multifilter">multifilter</h2>

A group of properties defining the behavior of your multifilter UI.

### enable




A boolean dictating whether or not to enable multifilter functionality.

If `true`, MixItUp will query the DOM for any elements with a
`data-filter-group` attribute present on instantiation.


|Type | Default
|---  | ---
|`boolean`| `false`

### logicWithinGroup




A string dictating the logic to use when concatenating selectors within
individual filter groups.

If set to `'or'` (default), targets will be shown if they match any
active filter in the group.

If set to `'and'`, targets will be shown only if they match
all active filters in the group.


|Type | Default
|---  | ---
|`string`| `'or'`

### logicBetweenGroups




A string dictating the logic to use when concatenating each group's
selectors into one single selector.

If set to `'and'` (default), targets will be shown only if they match
the combined active selectors of all groups.

If set to `'or'`, targets will be shown if they match the active selectors
of any individual group.


|Type | Default
|---  | ---
|`string`| `'and'`

### minSearchLength




An integer dictating the minimum number of characters at which the value
of a text input will be included as a multifilter. This prevents short or
incomplete words with many potential matches from triggering
filter operations.


|Type | Default
|---  | ---
|`number`| `3`

### parseOn




A string dictating when the parsing of filter groups should occur.

If set to `'change'` (default), the mixer will be filtered whenever the
filtering UI is interacted with. The mode provides real-time filtering with
instant feedback.

If set to `'submit'`, the mixer will only be filtered when a submit button is
clicked (if using a `<form>` element as a parent). This enables the user to firstly
make their selection, and then trigger filtering once they have
finished making their selection.

Alternatively, the `mixer.parseFilterGroups()` method can be called via the API at any
time to trigger the parsing of filter groups and filter the mixer.


|Type | Default
|---  | ---
|`string`| `'change'`

### keyupThrottleDuration




An integer dictating the duration in ms that must elapse between keyup
events in order to trigger a change.

Setting a comfortable delay of ~350ms prevents the mixer from being
thrashed while typing occurs.


|Type | Default
|---  | ---
|`number`| `350`


