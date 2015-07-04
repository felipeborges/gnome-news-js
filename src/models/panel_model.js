/* -*- Mode: js; indent-tabs-mode: nil; c-basic-offset: 4; tab-width: 4 -*- */
/*
 * Copyright (C) 2015 Felipe Borges
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General
 * Public License along with this library; if not, see <http://www.gnu.org/licenses/>.
 */

const Cairo = imports.gi.cairo;
const Gd = imports.gi.Gd;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const PanelModel = new Lang.Class({
    Name: 'PanelModel',

    _init: function() {
        this.model = Gtk.ListStore.new(
            [ GObject.TYPE_STRING,
              GObject.TYPE_STRING,
              GObject.TYPE_STRING,
              GObject.TYPE_STRING,
              Cairo.Surface,
              GObject.TYPE_LONG,
              GObject.TYPE_BOOLEAN,
              GObject.TYPE_UINT ]);
        this.model.set_sort_column_id(Gd.MainColumns.MTIME,
                                      Gtk.SortType.DESCENDING);
    },

    _addItem: function(item) {
        let iter = this.model.append();
        this.model.set(iter,
            [ 0, 1, 2, 3, 4 ],
            [ item.id, "", "", "", item.surface ]);
    },

    _onItemAdded: function(manager, item) {
        this._addItem(item);
    },
});
