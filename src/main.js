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

pkg.initGettext();
pkg.initFormat();
pkg.require({ 'Gdk': '3.0',
              'Gio': '2.0',
              'GLib': '2.0',
              'GObject': '2.0',
              'Gtk': '3.0' });

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Util = imports.utils.util;
const Tracker = imports.gi.Tracker;

const Manager = imports.models.manager;
const Query = imports.models.query;
const TrackerController = imports.presenters.tracker_controller;
const Window = imports.presenters.window;

let newManager = null;
let connection = null;
let connectionQueue = null;
let queryBuilder = null;
let settings = null;

function initEnvironment() {
    window.getApp = function() {
        return Gio.Application.get_default();
    };
}

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.Application,

    _init: function() {
        this.parent({ application_id: "org.gnome.News" });

        GLib.set_application_name(_("News"));
    },

    _onQuit: function() {
        this.quit();
    },

    _initAppMenu: function() {
        let builder = new Gtk.Builder();
        builder.add_from_resource('/org/gnome/News/views/app-menu.ui');

        let menu = builder.get_object('app-menu');
        this.set_app_menu(menu);
    },

    vfunc_startup: function() {
        this.parent();

        // connect to Tracker
        try {
            connection = Tracker.SparqlConnection.get(null);
        } catch (err) {
            log('Unable to connect to the Tracker database: ' + err.toString());
            return;
        }

        connectionQueue = new TrackerController.TrackerConnectionQueue();
        queryBuilder = new Query.QueryBuilder();
        newManager = new Manager.BaseManager();

        settings = new Gio.Settings({
            schema_id: 'org.gnome.News',
        });

        Util.loadStyleSheet('/org/gnome/News/views/application.css');

        Util.initActions(this,
                         [{ name: 'quit',
                            activate: this._onQuit }]);
        this._initAppMenu();
    },

    vfunc_activate: function() {
        (new Window.Window({ application: this })).show();
    },

    vfunc_shutdown: function() {

        this.parent();
    }
});

function main(argv) {
    initEnvironment();

    return (new Application()).run(argv);
}
