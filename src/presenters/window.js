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

const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Params = imports.utils.params;
const Util = imports.utils.util;

const Application = imports.main;
const Panel = imports.presenters.panel;

const Window = new Lang.Class({
    Name: 'Window',
    Extends: Gtk.ApplicationWindow,
    Properties: {
        'search-active': GObject.ParamSpec.boolean('search-active', '', '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, false)
    },

    _init: function(params) {
        params = Params.fill(params, { title: _("News"),
                                       width_request: 640,
                                       height_request: 480,
                                       window_position: Gtk.WindowPosition.CENTER });
        this.parent(params);

        this._loadWindowSizeAndPosition();

        this._searchActive = false;

        Util.initActions(this,
                         [{ name: 'new',
                             activate: this._new },
                          { name: 'about',
                            activate: this._about },
                          { name: 'search-active',
                            activate: this._toggleSearch,
                            parameter_type: new GLib.VariantType('b'),
                            state: new GLib.Variant('b', false) }]);

        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/News/views/main.ui');

        this.set_titlebar(builder.get_object('main-header'));

        let searchBtn = builder.get_object('search-active-button');
        this.bind_property('search-active', searchBtn, 'active',
                           GObject.BindingFlags.SYNC_CREATE |
                           GObject.BindingFlags.BIDIRECTIONAL);
        this._searchBar = builder.get_object('main-search-bar');
        this.bind_property('search-active', this._searchBar, 'search-mode-enabled',
                           GObject.BindingFlags.SYNC_CREATE |
                           GObject.BindingFlags.BIDIRECTIONAL);
        let searchEntry = builder.get_object('main-search-entry');
        this._searchBar.connect_entry(searchEntry);

        let grid = builder.get_object('main-grid');
        let switcher = builder.get_object('stack-switcher');
        this._view = new Panel.MainView();
        switcher.set_stack(this._view);
        grid.add(this._view);

        this.add(grid);
        grid.show_all();

        this.connect('key-press-event', this._handleKeyPress.bind(this));
        this.connect('window-state-event', this._onWindowStateEvent.bind(this));
        this.connect('delete-event', this._quit.bind(this));
    },

    _loadWindowSizeAndPosition: function() {
        let size = Application.settings.get_value('window-size');
        if (size.n_children() == 2) {
            let [width, height] = [size.get_child_value(0), size.get_child_value(1)];

            this.set_default_size(width.get_int32(), height.get_int32());
        }

        let position = Application.settings.get_value('window-position');
        if (position.n_children() == 2) {
            let [x, y] = [position.get_child_value(0), position.get_child_value(1)];

            this.move(x.get_int32(), y.get_int32());
        }

        if (Application.settings.get_boolean('window-maximized'))
            this.maximize();
    },

    _saveWindowGeometry: function() {
        let window = this.get_window();
        let state = window.get_state();

        if (state & Gdk.WindowState.MAXIMIZED)
            return;

        let size = this.get_size();
        Application.settings.set_value('window-size', GLib.Variant.new ('ai', size));

        let position = this.get_position();
        Application.settings.set_value('window-position', GLib.Variant.new ('ai', position));
    },

    _onWindowStateEvent: function(widget, event) {
        let state = this.get_window().get_state();

        let maximized = (state & Gdk.WindowState.MAXIMIZED);
        Application.settings.set_boolean('window-maximized', maximized);
    },

    get search_active() {
        return this._searchActive;
    },

    set search_active(v) {
        if (this._searchActive == v)
            return;

        this._searchActive = v;
        // do something with v
        this.notify('search-active');
    },

    _handleKeyPress: function(self, event) {
        return this._searchBar.handle_event(event);
    },

    _new: function() {
        log(_("New something"));
    },

    _quit: function() {
        this._saveWindowGeometry();

        return false;
    },

    _about: function() {
        let aboutDialog = new Gtk.AboutDialog(
            { authors: [ 'Felipe Borges <felipeborges@gnome.org>' ],
              artists: [ 'Allan Day <allanpday@gmail.com>' ],
              translator_credits: _("translator-credits"),
              program_name: _("News"),
              comments: _("A feed reader application for GNOME"),
              copyright: 'Copyright 2015 Felipe Borges',
              license_type: Gtk.License.GPL_2_0,
              logo_icon_name: 'org.gnome.News',
              version: pkg.version,
              website: 'https://wiki.gnome.org/Design/Apps/Potential/News',
              wrap_license: true,
              modal: true,
              transient_for: this
            });

        aboutDialog.show();
        aboutDialog.connect('response', function() {
            aboutDialog.destroy();
        });
    },
});
