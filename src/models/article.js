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
const GdkPixbuf = imports.gi.GdkPixbuf;
const GnPrivate = imports.gi.GnPrivate;
const Lang = imports.lang;
const Signals = imports.signals;

const Query = imports.models.query;

const Article = new Lang.Class({
    Name: 'Article',

    _init: function(cursor) {
        this.id = null;
        this.uri = null;
        this.title = null;
        this.url = null;
        this.dateCreated = null;
        this.date = null;
        this.isRead = null;
        this.dateReceived = null;
        this.downloadedTime = null;

        this.surface = null;
        this.content = null;

        this.populateFromCursor(cursor);
    },

    populateFromCursor: function(cursor) {
        this.id = cursor.get_string(Query.QueryColumns.URN)[0];
        this.uri = cursor.get_string(Query.QueryColumns.URI)[0];
        this.title = cursor.get_string(Query.QueryColumns.TITLE)[0];
        this.url = cursor.get_string(Query.QueryColumns.URL)[0];
        this.dateCreated = cursor.get_string(Query.QueryColumns.DATE_CREATED)[0];
        this.date = cursor.get_string(Query.QueryColumns.DATE)[0];
        this.isRead = cursor.get_string(Query.QueryColumns.IS_READ)[0];
        this.dateReceived = cursor.get_string(Query.QueryColumns.DATE_RECEIVED)[0];
        this.downloadedTime = cursor.get_string(Query.QueryColumns.DOWNLOADED_TIME)[0];

        this._generateThumbnail();
    },

    _generateThumbnail: function() {
        // write a private lib to draw the thumbnail on a Cairo surface
        print(GnPrivate.test(42));
        return;
    },
});
Signals.addSignalMethods(Article.prototype);
