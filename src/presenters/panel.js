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

const Application = imports.main;
const Article = imports.models.article;
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
        this.set_visible_child_full('view', Gtk.StackTransitionType.NONE);
        this.show_all();
    },

    _finalizeQuery: function(object, res) {
        let cursor = null;

        try {
            cursor = object.query_finish(res);
            cursor.next_async(null, this._onCursorNext.bind(this));
        } catch (err) {
            log("error " + err.toString());
            this.set_visible_child_full('no-results', Gtk.StackTransitionType.NONE);
        }
    },

});

const NewPanel = new Lang.Class({
    Name: 'NewPanel',
    Extends: Panel,

    _init: function() {
        this.parent();

        this._model = new PanelModel.PanelModel();
        this.view.set_model(this._model.model);

        // load initial items
        let query = Application.queryBuilder.buildFetchNewArticlesQuery(15);
        Application.connectionQueue.add(query.sparql, null, this._finalizeQuery.bind(this));
    },

    _onCursorNext: function(cursor, res) {
        let valid = false;

        try {
            valid = cursor.next_finish(res);
        } catch (err) {
            log ("err " + err.toString());
        }

        if (!valid) {
            cursor.close();
            return;
        }

        Application.newManager.addItem(new Article.Article(cursor));

        cursor.next_async(null, this._onCursorNext.bind(this));
    },
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);

        this._newPanel = new NewPanel();
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
