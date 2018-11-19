import { MenuComponent } from "./components";

async function createNode(component, { x, y }) {
  const node = await component.createNode();

  node.position[0] = x;
  node.position[1] = y;

  return node;
}

function createMenu(editor, props) {
  const el = document.createElement("div");

  editor.view.container.appendChild(el);

  const menu = new MenuComponent(props);

  el.appendChild(menu.root);

  return menu;
}

function install(editor, { searchBar = true, delay = 1000, allocate = () => [] }) {
  editor.bind("hidecontextmenu");

  const mouse = { x: 0, y: 0 };

  const menu = createMenu(editor, { searchBar, delay });
  const nodeMenu = createMenu(editor, { searchBar: false, delay });

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

  editor.on("componentregister", component => {
    menu.addItem({
      title: component.name,
      async onClick() {
        editor.addNode(await createNode(component, mouse));
      },
      path: allocate(component)
    });
  });

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
