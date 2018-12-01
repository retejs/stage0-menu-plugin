Rete Stage0 renderer menu plugin
====
#### Rete.js plugin

Example: https://codepen.io/anon/pen/jQBxKe

Package features a separate CSS stylesheet

```js
import Stage0MenuPlugin from 'stage0-rete-menu-plugin';

editor.use(MenuPlugin, {
    searchBar: false,
    delay: 100,
    docked: true,
    allocate(component) {
        if (component.name == "Number") {
            return false;
        }
        return ["submenu", "subsubmenu"];
    },
    items: {
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
| `delay` | Delay hide, ms | `100`
| `allocate` | function for placing of components into submenu (return false to exclude) | `() => []`
| `docked` | If you want Blender style docked menu | `false`
| `items` | Hand crafted menu | `{}`