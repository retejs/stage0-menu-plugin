import h from "stage0";
import { reconcile } from "stage0/reconcile";

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
export function MenuComponent({ searchBar, delay }) {
  this.items = [];

  this.visibleItems = [];
  this.renderedItems = [];

  this.visible = false;
  this.x = 0;
  this.y = 0;
  this.args = {};
  this.delay = delay || 100;
  this.leafs = [];

  this.showSearchBar = searchBar;
  this.searchBar = this.showSearchBar ? new SearchBarComponent(this) : null;

  this.hideTimeout = null;

  BaseComponent.call(this, {});
}

MenuComponent.prototype.init = function(io) {
  BaseComponent.prototype.init.call(this, io.socket);
  if (this.showSearchBar) this.root.insertBefore(this.searchBar.root, this.refs.items);
};

MenuComponent.prototype.getView = function() {
  return h(["<div class='context-menu'><div #items></div></div>"]);
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
  this.visibleItems = this.visible ? this.items.slice() : [];

  if (search != "") {
    this.visibleItems = this.leafs.filter(item => {
      return item.title.toLowerCase().indexOf(search.toLowerCase()) > -1;
    });
  }

  if (!this.visible) {
    this.root.style.display = "none";
  } else {
    this.root.style.display = "block";
  }

  reconcile(
    this.refs.items,
    this.renderedItems,
    this.visibleItems,
    item => this.getItemComponent(item, this.delay, this.args).root,
    (node, item) => node.update(item)
  );

  this.renderedItems = this.visibleItems.slice();
  this.updateStyle();
};

MenuComponent.prototype.addItem = function({ title, onClick, path = [] }) {
  let items = this.items;

  for (let level of path) {
    let exist = items.find(i => i.title === level);

    if (!exist) {
      exist = { title: level, subitems: [] };
      items.push(exist);
    }

    items = exist.subitems;
  }

  this.leafs.push({ title, onClick });

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
  BaseComponent.call(this, item);
}

ItemComponent.prototype.init = function(i) {
  BaseComponent.prototype.init.call(this, i);

  if(i.onClick){
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

ItemComponent.prototype.rootUpdate = function({ title, subitems, onClick }) {
  this.refs.title.nodeValue = title;  
  this.visibleSubItems = this.showSubItems ? subitems || [] : [];

  if (subitems && subitems.length) {
    this.root.classList.add("hasSubitems");
  } else {
    this.root.classList.remove("hasSubitems");
  }

  reconcile(
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
};

SearchBarComponent.prototype.getView = function() {
  return h(["<div class='search'><input #search/></div>"]);
};

SearchBarComponent.prototype.rootUpdate = function() {};

extend(SearchBarComponent, BaseComponent);
