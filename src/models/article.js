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
const Lang = imports.lang;
const Signals = imports.signals;

const Article = new Lang.Class({
    Name: 'Article',

    _init: function(cursor) {
        this.id = null;
        this.uri = null;
        this.title = null;
        this.author = null;
        this.mtime = null;
        this.resourceUrn = null;
        this.image = null;
        this.surface = null;
        this.content = null;

        this.populateFromCursor(cursor);
    },

    populateFromCursor: function(cursor) {

        if (!this.image)
            this._generateThumbnail();
    },

    _generateThumbnail: function() {
        // draw cairo surface on this.surface

        this.emit('info-updated');
    },
});
Signals.addSignalMethods(Article.prototype);
