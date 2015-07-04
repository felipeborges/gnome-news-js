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

const Gd = imports.gi.Gd;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Params = imports.utils.params;

const PanelModel = imports.models.panel_model;

const Panel = new Lang.Class({
    Name: 'Panel',
    Extends: Gtk.Stack,

    _init: function() {
        this.parent({
            homogeneous: true,
            transition_type: Gtk.StackTransitionType.CROSSFADE,
        });

        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/News/views/no-results-page.ui');

        this._noResults = builder.get_object('grid');
        this.add_named(this._noResults, 'no-results');

        this.view = new Gd.MainView({
            shadow_type: Gtk.ShadowType.NONE,
        });
        this.add_named(this.view, 'view');
        this.set_visible_child_full('no-results', Gtk.StackTransitionType.NONE);
        this.show_all();

        this._model = new PanelModel.PanelModel();
        // do that only when we got results to show
        this.view.set_model(this._model.model);
    },
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);

        this._newPanel = new Panel();
        this.add_titled(this._newPanel, 'new', _("New"));

        this._feedsPanel = new Panel();
        this.add_titled(this._feedsPanel, 'feeds', _("Feeds"));

        this._starredPanel = new Panel();
        this.add_titled(this._starredPanel, 'starred', _("Starred"));

        this._readPanel = new Panel();
        this.add_titled(this._readPanel, 'read', _("Read"));

        // create preview view
        this._preview = new Gtk.Stack();
        this.add_named(this._preview, 'preview');
    },
});
