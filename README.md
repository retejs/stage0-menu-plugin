Rete Stage0 renderer menu plugin
====
#### Rete.js plugin

```js
import Stage0MenuPlugin from 'stage0-rete-menu-plugin';

editor.use(MenuPlugin, {
    searchBar: false,
    delay: 100,
    docked: true, // If you want Blender style docked menu
    allocate(component) {
        if (component.name == "Number") {
            return false; // Don't add
        }
        return ["submenu", "subsubmenu"];
    },
    items: { // Hand crafted menu
        "Menu": {
            "Add component": components[1],
            "Fn": () => {
                alert("Fn");
            }
        }
    }
});
```
| Options | Description | Default |
|-|-|-|
| `searchBar` | Showing search bar | `true`
| `delay` | Delay hide, ms | `1000`
| `allocate` | function for placing of components into submenu | `() => []`


You can arbitrarily put a component in a submenu. Examples: 

```js
allocate() { return ["Single submenu"] }
```

```js
allocate(component) { return component.path } // where path is a stack of menu for every component
```