import h from "stage0";
import { keyed } from "stage0/keyed";

import "./menu.sass";
import "./item.sass";
import "./search.sass";

/**
 * Base component
 * @param {*} scope
 */
export function BaseComponent(scope) {
  const view = this.getView();

  this.root = view.cloneNode(true);

  const refCl = view.collect(this.root);

  this.setRefs(refCl);
  this.init(scope);
}

BaseComponent.prototype = {
  getView: function() {
    return h(["<div></div>"]);
  },
  init: function(scope) {
    this.root.update = this.rootUpdate.bind(this);
    this.root.update(scope);
  },
  setRefs: function(refCl) {
    this.refs = refCl;
  },
  rootUpdate: function(_scope) {}
};

export function extend(ChildClass, ParentClass) {
  ChildClass.prototype = Object.assign({}, ParentClass.prototype, ChildClass.prototype);
  ChildClass.prototype.constructor = ChildClass;
}

/**
 * MenuComponent
 * @param {*} socket
 * @param {*} type
 */
export function MenuComponent({ searchBar, delay, docked }) {
  this.items = [];

  this.visibleItems = [];
  this.renderedItems = [];

  this.visible = false;
  this.x = 0;
  this.y = 0;
  this.args = {};
  this.delay = delay || 100;
  this.leafs = [];
  this.docked = docked;

  this.showSearchBar = searchBar === undefined ? true : searchBar;
  this.searchBar = this.showSearchBar ? new SearchBarComponent(this) : null;

  this.hideTimeout = null;

  BaseComponent.call(this, {});
}

MenuComponent.prototype.init = function(scope) {
  BaseComponent.prototype.init.call(this, scope);
  if (this.showSearchBar) {
    this.root.insertBefore(this.searchBar.root, this.refs.items);
  }
  if (this.docked) {
    this.root.classList.add("docked");
  }
};

MenuComponent.prototype.getView = function() {
  return h(["<div class='menu'><div #items></div></div>"]);
};

MenuComponent.prototype.getItemComponent = function(item, delay, menuArgs) {
  return new ItemComponent(item, delay, menuArgs);
};

MenuComponent.prototype.show = function(x, y, args = {}) {
  if (this.hideTimeout) {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
  } else {
    if (this.showSearchBar) this.searchBar.refs.search.value = "";
    this.visible = true;
    this.x = x;
    this.y = y;
    this.args = args;
    this.rootUpdate();
  }
};

MenuComponent.prototype.hide = function() {
  if (this.visible && !this.hideTimeout) {
    this.hideTimeout = setTimeout(() => {
      this.visible = false;
      this.rootUpdate();
      this.hideTimeout = null;
    }, this.delay);
  }
};

MenuComponent.prototype.updateStyle = function() {
  this.root.style.top = this.y + "px";
  this.root.style.left = this.x + "px";
};

MenuComponent.prototype.rootUpdate = function(search = "") {
  this.visibleItems = this.docked || this.visible ? this.items.slice() : [];

  if (search != "") {
    this.visibleItems = this.docked
      ? [
          {
            title: "Search",
            visible: true,
            subitems: this.leafs.filter(item => {
              return item.title.toLowerCase().indexOf(search.toLowerCase()) > -1;
            })
          }
        ]
      : this.leafs.filter(item => {
          return item.title.toLowerCase().indexOf(search.toLowerCase()) > -1;
        });
  }

  if (!this.docked && (!this.visible || !this.visibleItems.length)) {
    this.root.style.display = "none";
  } else {
    this.root.style.display = "block";
  }

  keyed(
    "title",
    this.refs.items,
    this.renderedItems,
    this.visibleItems,
    item => this.getItemComponent(item, this.delay, this.args).root,
    (node, item) => node.update(item)
  );

  this.renderedItems = this.visibleItems.slice();

  if (!this.docked) {
    this.updateStyle();
  }
};

MenuComponent.prototype.initItemsTrav = function(items, createNode, path = []) {
  if (items.data) {
    const title = path.pop();

    this.addItem({
      title: title,
      onClick: () => {
        createNode(items);
      },
      path
    });
  } else if (typeof items === "function") {
    const title = path.pop();

    this.addItem({
      title: title,
      onClick: () => {
        items();
      },
      path
    });
  } else {
    for (const key in items) {
      let newPath = path.slice();
      newPath.push(key);
      this.initItemsTrav(items[key], createNode, newPath);
    }
  }
};

MenuComponent.prototype.initItems = function(items, createNode) {
  this.initItemsTrav(items, createNode);
  this.rootUpdate();
};

MenuComponent.prototype.addItem = function({ title, onClick, path = [] }) {
  let items = this.items;

  for (let levelKey in path) {
    const level = path[levelKey];
    let exist = items.find(i => i.title === level);

    if (!exist) {
      exist = { title: level, subitems: [] };
      items.push(exist);
    }

    items = exist.subitems;
  }

  this.leafs.push({ title, onClick, path });

  items.push({ title, onClick });

  this.rootUpdate();
};

extend(MenuComponent, BaseComponent);

/**
 * ItemComponent
 * @param {*} item
 */
export function ItemComponent(item, delay, menuArgs) {
  this.showSubItems = false;
  this.visibleSubItems = [];
  this.renderedSubItems = [];
  this.hideTimeout = null;
  this.delay = delay;
  this.menuArgs = menuArgs;
  this.title;
  BaseComponent.call(this, item);
}

ItemComponent.prototype.init = function(i) {
  BaseComponent.prototype.init.call(this, i);

  if (i.onClick) {
    this.root.onclick = () => {
      i.onClick(this.menuArgs);
    };
  }

  this.root.onmouseover = () => {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    } else {
      this.showSubItems = true;
      this.rootUpdate(i);
    }
  };
  this.root.onmouseleave = () => {
    if (this.showSubItems && !this.hideTimeout) {
      this.hideTimeout = setTimeout(() => {
        this.showSubItems = false;
        this.rootUpdate(i);
        this.hideTimeout = null;
      }, this.delay);
    }
  };
};

ItemComponent.prototype.getItemComponent = function(item) {
  return new ItemComponent(item);
};

ItemComponent.prototype.getView = function() {
  return h(["<div class='item'>#title<div class='subitems' #subitems></div></div>"]);
};

ItemComponent.prototype.rootUpdate = function({ title, subitems, path, visible }) {
  if (path) {
    title = path.join(" › ") + " › " + title;
  }

  if (this.title !== title) this.refs.title.nodeValue = title;

  this.title = title;

  if (subitems && subitems.length) {
    this.root.classList.add("hasSubitems");
  } else {
    this.root.classList.remove("hasSubitems");
  }

  this.visibleSubItems = this.showSubItems || visible ? subitems || [] : [];

  keyed(
    "title",
    this.refs.subitems,
    this.renderedSubItems,
    this.visibleSubItems,
    item => this.getItemComponent(item).root,
    (node, item) => node.update(item)
  );

  this.renderedSubItems = this.visibleSubItems.slice();
};

extend(ItemComponent, BaseComponent);

/**
 * SearchBarComponent
 * @param {*} item
 */
export function SearchBarComponent(menu) {
  BaseComponent.call(this, menu);
}

SearchBarComponent.prototype.init = function(menu) {
  BaseComponent.prototype.init.call(this, menu);
  this.refs.search.onkeyup = e => {
    menu.rootUpdate(e.target.value);
  };
  this.refs.search.onmousedown = e => {
    e.stopPropagation();
  };
  this.refs.clear.onmousedown = e => {
    e.stopPropagation();
  };
  this.refs.clear.onclick = e => {
    this.refs.search.value = "";
    menu.rootUpdate("");
  };
};

SearchBarComponent.prototype.getView = function() {
  return h(["<div class='search'><input #search/><span #clear>x</span></div>"]);
};

SearchBarComponent.prototype.rootUpdate = function() {};

extend(SearchBarComponent, BaseComponent);
