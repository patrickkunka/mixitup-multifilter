# 📣 November 2024 Update 📣

The MixItUp MultiFilter Extension is now **fully open source** and publicly available for all types of use. A purchase or commercial license is no longer required.

Read more: [MixItUp - November 2024 Update](https://github.com/patrickkunka/mixitup?tab=readme-ov-file#-november-2024-update-)

---

# MixItUp MultiFilter

[![Latest Release](https://img.shields.io/npm/v/mixitup-multifilter.svg?style=flat-square)](https://www.npmjs.com/package/mixitup-multifilter)

MixItUp MultiFilter is an extension for [MixItUp](https://github.com/patrickkunka/mixitup) which makes building multidimensional filtering UI effortless.

### Features

- Filter content by multiple dimensions or "filter groups" simultaneously
- Use any combination of AND/OR logic within and between filter groups
- Combine a wide variety of native form UI: buttons, selects, checkboxes, radio, and text inputs
- New API methods
- New configuration options

### Uses

- User interfaces where content must be searchable by two or more attributes (e.g. type, color, size)
- Perfect for E-commerce interfaces

### Limitations

- Client-side only - the entire target collection must exist in the DOM

*NB: If you're looking to integrate server-side ajax multidimensional with MixItUp, consider using MixItUp 3's Dataset API.*

### Demos

Hosted interactive demos may be found at [patrickkunka.github.io/mixitup-multifilter/demos](https://patrickkunka.github.io/mixitup-multifilter/demos). The documented source code of each demo can be found in the [/demos](./demos/) directory if this repository.

## Get Started

### Installing Extensions

MixItUp extensions may be included in your project via NPM and imported as modules, or loaded globally via a script tag.

#### Script Tag

If using a script tag, you simply need to load the multifilter distribution script (i.e. `mixitup-multifilter.min.js`) **after** mixitup, and the extension will automatically detect the `mixitup` global variable and install itself.

```html
        ...

        <script src="/path/to/mixitup.min.js"></script>
        <script src="/path/to/mixitup-multifilter.min.js"></script>
    </body>
</html>
```

#### Module Import

If you are building a modular JavaScript project with Webpack, Browserify, or RequireJS, no global variables are exposed. Firstly require both the MixItUp core *and* the MultiFilter extension into your module. Then call `mixitup.use()` with the extension passed in as an argument. Your extension will be installed and made available to all MixItUp instances throughout your project.

```js
// ES2015+

import mixitup from 'mixitup';
import mixitupMultifilter from 'mixitup-multifilter';

// Call the mixitup factory's .use() method, passing in the extension to install it

mixitup.use(mixitupMultifilter);
```

```js
// CommonJS

var mixitup = require('mixitup');
var mixitupMultifilter = require('mixitup-mulfitiler');

mixitup.use(mixitupMultifilter);
```

```js
// AMD

require([
    'mixitup',
    'mixitup-multifilter'
], function(
    mixitup,
    mixitupMultifilter
) {
    mixitup.use(mixitupMultifilter);
});
```

You need only call the `.use()` function once per project, per extension, as module loaders will cache a single reference to MixItUp inclusive of all changes made.

### Using MultiFilter

MixItUp MultiFilter extends MixItUp's API and configuration object with various new methods and properties, and adds the ability to query and index groups of filter controls, known as "filter groups".

By default, multifilter functionality is disabled so that you can use MixItUp as normal, even with the extension installed. To enable multifilter functionality for a mixer, you simply need set the `multifilter.enable` configuration option to `true`.

```js
var mixer = mixitup(containerEl, {
    multifilter: {
        enable: true // enable the multifilter extension for the mixer
    }
});
```

### Filtering Dimensions

MixItUp MultiFilter is designed to be used with content requiring filtering by multiple distinct attributes or "dimensions". Taking a clothing store as an example, some dimensions might include **type** (e.g. sweaters, shirts, jackets), **color** (red, green, blue), and **size** (small, medium, large).

Another example is the [filters](https://patrickkunka.github.io/mixitup-multifilter/demos/filters) demo which uses the dimensions of **shape** (e.g. square, triangle, circle), **color**, and **size**.

MixItUp MultiFilter allows us to combine filter selectors within each of these dimensions, using a variety of logic. To learn more about MixItUp filter logic, you may wish to read the [Filtering with MixItUp](https://github.com/patrickkunka/mixitup/tutorials/filtering-with-mixitup.md) tutorial before continuing.

### Filter Group UI

Filter groups are an essential part of a multifilter-enabled mixer and are defined in your markup. Each group represents a particular dimension, and can contain a many different types of UI within it. Filter groups are queried by MixItUp based on the presence of a `data-filter-group` attribute. You may use any outer element as a filter group, but `<fieldset>` makes sense semantically, particularly when using inputs like checkboxes or radios within it.

You can think of your entire multifilter UI as a `<form>` with which to interact with your mixer.

```html
<form>
    <fieldset data-filter-group>
        <button type="button" data-filter=".jacket">Jackets</button>
        <button type="button" data-filter=".sweater">Sweaters</button>
        <button type="button" data-filter=".shirt">Shirts</button>
    </fieldset>

    <fieldset data-filter-group>
        <button type="button" data-toggle=".red">Red</button>
        <button type="button" data-toggle=".blue">Blue</button>
        <button type="button" data-toggle=".green">Green</button>
    </fieldset>
</form>
```

*Wrapping filter groups in a parent `<form>` is optional, but provides the ability to use submit and reset buttons as part of your UI.*

In the example above, **filter control** buttons are used in the first group, and *toggle control* buttons are used in the second group. To recap the [Filtering with MixItUp](https://github.com/patrickkunka/mixitup/tutorials/filtering-with-mixitup.md) tutorial, filter controls allow one active control at a time, and toggle controls allow multiple active controls simultaneously. This behavior is also true when using filter groups, but is confined to within the group. Therefore, the UI above would allow us to select one type of clothing, but multiple colors.

Filter and toggle controls are just two example of the different types of UI available in MixItUp MultiFilter. Let's take a look at what else is available:

##### Radios

```html
<fieldset data-filter-group>
    <label>Red</label>
    <input type="radio" name="color" value=".red"/>

    <label>Blue</label>
    <input type="radio" name="color" value=".blue"/>

    <label>Green</label>
    <input type="radio" name="color" value=".green"/>
</fieldset>
```

Providing the same functionality as MixItUp's filter controls (one active input at a time), radios provide a more form-like UI with a smaller footprint.

##### Checkboxes

```html
<fieldset data-filter-group>
    <label>Red</label>
    <input type="checkbox" value=".red"/>

    <label>Blue</label>
    <input type="checkbox" value=".blue"/>

    <label>Green</label>
    <input type="checkbox" value=".green"/>
</fieldset>
```

Providing the same functionality as MixItUp's toggle controls (multiple active inputs at a time), checkboxes also provide a more form-like UI with a smaller footprint.

##### Selects

```html
<fieldset data-filter-group>
    <select>
        <option value="">Select a color</option>
        <option value=".red">Red</option>
        <option value=".blue">Blue</option>
        <option value=".green">Green</option>
    </select>
</fieldset>
```

Selects can be used to select one value from many values with a very small footprint. If the multiple attribute is added (`<select multiple>`), selects can also be used to select multiple values.

##### Text

```html
<fieldset data-filter-group>
    <input type="text" data-search-attribute="class" placeholder="Search by color"/>
</fieldset>
```

Text inputs can be used to search targets by a partial or complete string. A `data-search-attribute` must be added to the input to tell MixItUp which attribute to search. The example above searches the `class` attribute, consistent with the other examples. For example, entering the string `'Gree'` would show any targets with the class `'green'`.

NB: The value of your text input will be converted to lowercase before searching, so ensure that the contents of the attribute you intend to search are also lowercase.

### Configuring Filter Group Logic

MixItUp MultiFilter allows us to define one type of logic between filter groups and another type within them, using the configuration options `multifilter.logicBetween` and `multifilter.logicWithin`.

The most common (and default) combination of logic is `'or'` within groups and `'and'` between. It should be noted that this combination will suit the vast majority of multifiltering projects, but you may configure either of these properties to be `'and'` and `'or'` as necessary.

You may also override the `multifilter.logicWithin` setting on a per-group basis by adding a `data-logic` attribute to your filter group's markup, with a value of either `'or'` or `'and'`:

###### Example: Overriding multifilter.logicWithin for a specific group

```html
<fieldset data-filter-group data-logic="and">
```

To visualize what's meant by combining logic between groups, consider the following:

**Show (shirts OR sweaters) AND (red OR blue) AND Large**

This would be an example or `'or'` logic within groups, and `'and'` logic between, and as noted above, is the most common combination of logic. Given this combination of active UI elements, MixItUp MultiFilter will generate the following selector string with which to filter the content of your container:

```
'.shirt.red.large, .shirt.blue.large, .sweater.red.large, .sweater.blue.large'
```

To help with debugging and development you may wish to console log the generated selector using one of MixItUp's callback functions. For example:

###### Example: Logging the generated filter selector using the onMixStart callback

```js
var mixer = mixitup('.container', {
    multifilter: {
        enable: true
    },
    callbacks: {
        onMixStart: function(state, futureState) {
            console.log(futureState.activeFilter.selector);
        }
    }
});
```

In addition to the configuration options already mentioned, MixItUp MultiFilter also makes use of several existing configuration options from the MixItUp core. These include:

#### controls.toggleDefault

Defines the toggle filter state when all controls are deactivated. The available options are 'all' (default), or 'none'.

#### controls.scope

Defines whether multifilter UI should be isolated to a specific mixer (`'local'`), or global to the document (`'global'`).

See the [Configuration Object](./docs/mixitup.Config.md) documentation page for more information about configuring MixItUp MultiFilter.

### Additional Form Behavior

As mentioned previously, we can think of our multifilter UI as a `<form>` with which to interact with our mixer. Adding a parent a `<form>` element to our UI also provides some additional benefits:

#### Reset Buttons

Reset buttons can be included within a form of filter groups to clear and reset all active UI and return the mixer to its default filter state (see `controls.toggleDefault`).

This is a very common UI pattern in search interfaces and allows the user to quickly return to full set of content without having to deactivate every UI element individually.

```html
<form>
    <fieldset data-filter-group>
       ...
    </fieldset>

    <fieldset data-filter-group>
       ...
    </fieldset>

    <button type="reset">Clear filters</button>
</form>
```

Similarly, if we want the ability reset an individual filter group, we can use individual forms as filter group elements, and nest reset buttons within them:

```html
<div>
    <form data-filter-group>
       ...
       <button type="reset">Clear filters</button>
    </form>

    <form data-filter-group>
       ...
       <button type="reset">Clear filters</button>
    </form>
</div>
```

#### Submit Buttons

The default behavior of MixItUp MultiFilter is to trigger a filter operation whenever a control is clicked, or an input value changes. This allows the user to see the content change in real time as they interact with the UI.

By adding a submit button and changing the value of the `ultifilter.parseOn` configuration option from `'change'` to `'submit'`, we can delay the filter operation until the user has made their selection and is ready to search. The filter operation will then be triggered only when the user clicks the submit button.

###### Example: Changing the multifilter.parseOn configuration option

```js
var mixer = mixitup('.container', {
    multifilter: {
        parseOn: 'submit'
    }
});
```

```html
<form>
    <fieldset data-filter-group>
       ...
    </fieldset>

    <fieldset data-filter-group>
       ...
    </fieldset>

    <button type="reset">Clear filters</button>
    <button type="submit">Search</button>
</form>
```

To prevent users from accidentally triggering an HTTP form submission by clicking submit before your application's JavaScript has loaded, you may add a disabled attribute to the submit button, and MixItUp MultiFilter will remove it once it has parsed your markup.

```html
<button type="submit" disabled>Search</button>
```

#### Named Filter Groups

If we wish to interact with our filter groups via the `.setFilterGroupSelectors()` API method (see [Mixer API Methods](./docs/mixitup.Mixer.md)), we can name our groups by providing a value to `data-filter-group` attribute.

```html
<form>
    <fieldset data-filter-group="color">
        ...
    </fieldset>

    <fieldset data-filter-group="size">
        ...
    </fieldset>
</form>
```

We can then target that group by its name when we call the API method:

```js
mixer.setFilterGroupSelectors('color', ['.green', '.blue']);

mixer.parseFilterGroups()
```