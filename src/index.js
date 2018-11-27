import { MenuComponent } from "./components";

async function createNode(component, { data = {}, meta = {}, x, y, docked = false, editor }) {
  const node = await component.createNode(data);

  node.meta = meta;

  if (!docked) {
    node.position[0] = x;
    node.position[1] = y;
  } else {
    node.position[0] = -editor.view.area.transform.x;
    node.position[1] = -editor.view.area.transform.y;
  }

  return node;
}

function createMenu(editor, props) {
  const el = document.createElement("div");

  editor.view.container.appendChild(el);

  const menu = new MenuComponent(props);

  el.appendChild(menu.root);

  return menu;
}

function configureMenu(menu, { items, mouse, docked, editor, allocate }) {
  if (items) {
    menu.initItems(items, async _component => {
      editor.addNode(await createNode(_component, { ...mouse, docked, editor }));
    });
  }

  editor.on("componentregister", component => {
    const allocateRes = allocate(component);

    if (allocateRes) {
      menu.addItem({
        title: component.name,
        async onClick() {
          editor.addNode(await createNode(component, { ...mouse, docked, editor }));
        },
        path: allocateRes
      });
    }
  });
}

function install(
  editor,
  { searchBar = true, delay = 1000, allocate = () => [], items = null, docked = false }
) {
  editor.bind("hidecontextmenu");

  const mouse = { x: 0, y: 0 };

  const menu = createMenu(editor, { searchBar, delay, docked: false });
  const dockedMenu = !docked ? null : createMenu(editor, { searchBar, delay, docked: true });
  const nodeMenu = createMenu(editor, { searchBar: false, delay, docked: false });

  editor.on("hidecontextmenu", () => {
    nodeMenu.hide();
    menu.hide();
  });

  nodeMenu.addItem({
    title: "Delete",
    onClick(args) {
      editor.removeNode(args.node);
      nodeMenu.hide();
    }
  });

  nodeMenu.addItem({
    title: "Clone",
    async onClick(args) {
      const {
        name,
        data,
        meta,
        position: [x, y]
      } = args.node;
      const component = editor.components.get(name);

      editor.addNode(await createNode(component, { data, meta, x: x + 10, y: y + 10, editor, docked: false }));
      nodeMenu.hide();
    }
  });

  configureMenu(menu, { items, mouse, docked: false, editor, allocate });
  if (dockedMenu) configureMenu(dockedMenu, { items, mouse, docked: true, editor, allocate });

  editor.on("mousemove", ({ x, y }) => {
    mouse.x = x;
    mouse.y = y;
  });

  editor.on("click", () => {
    editor.trigger("hidecontextmenu");
  });

  editor.on("contextmenu", ({ e, node }) => {
    e.preventDefault();
    e.stopPropagation();
    editor.trigger("hidecontextmenu");

    const [x, y] = [e.clientX, e.clientY];

    if (node) {
      nodeMenu.show(x, y, { node });
    } else {
      menu.show(x, y);
    }
  });
}

export default {
  install
};
