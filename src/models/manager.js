/*
 * Copyright (c) 2011 Red Hat, Inc.
 *
 * Gnome Documents is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gnome Documents is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Cosimo Cecchi <cosimoc@redhat.com>
 *
 */

const Lang = imports.lang;
const Signals = imports.signals;

const BaseManager = new Lang.Class({
    Name: 'BaseManager',

    _init: function(title) {
        this._items = {};
        this._activeItem = null;
        this._title = null;
        this._actionId = null;

        if (title)
            this._title = title;
    },

    getTitle: function() {
        return this._title;
    },

    getItemById: function(id) {
        let retval = this._items[id];

        if (!retval)
            retval = null;

        return retval;
    },

    addItem: function(item) {
        let oldItem = this._items[item.id];
        if (oldItem)
            this.removeItem(oldItem);

        this._items[item.id] = item;
        this.emit('item-added', item);
    },

    setActiveItem: function(item) {
        if (item != this._activeItem) {
            this._activeItem = item;
            this.emit('active-changed', this._activeItem);

            return true;
        }

        return false;
    },

    setActiveItemById: function(id) {
        let item = this.getItemById(id);
        return this.setActiveItem(item);
    },

    getItems: function() {
        return this._items;
    },

    getItemsCount: function() {
        return Object.keys(this._items).length;
    },

    getActiveItem: function() {
        return this._activeItem;
    },

    removeItem: function(item) {
        this.removeItemById(item.id);
    },

    removeItemById: function(id) {
        let item = this._items[id];

        if (item) {
            delete this._items[id];
            this.emit('item-removed', item);
            item._manager = null;
        }
    },

    clear: function() {
        this._items = {};
        this._activeItem = null;
        this.emit('clear');
    },

    getFilter: function(flags) {
        log('Error: BaseManager implementations must override getFilter');
    },

    getWhere: function() {
        let item = this.getActiveItem();
        let retval = '';

        if (item && item.getWhere)
            retval = item.getWhere();

        return retval;
    },

    forEachItem: function(func) {
        for (let idx in this._items)
            func(this._items[idx]);
    },

    getAllFilter: function() {
        let filters = [];

        this.forEachItem(function(item) {
            if (item.id != 'all')
                filters.push(item.getFilter());
        });

        return '(' + filters.join(' || ') + ')';
    },

    processNewItems: function(newItems) {
        let oldItems = this.getItems();
        let idx;

        for (idx in oldItems) {
            let item = oldItems[idx];

            // if old items are not found in the new array,
            // remove them
            if (!newItems[idx] && !item.builtin)
                this.removeItem(oldItems[idx]);
        }

        for (idx in newItems) {
            // if new items are not found in the old array,
            // add them
            if (!oldItems[idx])
                this.addItem(newItems[idx]);
        }

        // TODO: merge existing item properties with new values
    }
});
Signals.addSignalMethods(BaseManager.prototype);
