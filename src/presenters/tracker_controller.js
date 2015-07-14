/*
 * Copyright (c) 2011, 2013, 2014 Red Hat, Inc.
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

const Application = imports.main;
const Query = imports.models.query;
const Utils = imports.utils.util;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const _ = imports.gettext.gettext;

const QueryType = {
    SELECT: 0,
    UPDATE: 1,
    UPDATE_BLANK: 2
};

const TrackerConnectionQueue = new Lang.Class({
    Name: 'TrackerConnectionQueue',

    _init: function() {
        this._queue = [];
        this._running = false;
    },

    add: function(query, cancellable, callback) {
        let params = { query: query,
                       cancellable: cancellable,
                       callback: callback,
                       queryType: QueryType.SELECT };
        this._queue.push(params);

        this._checkQueue();
    },

    update: function(query, cancellable, callback) {
        let params = { query: query,
                       cancellable: cancellable,
                       callback: callback,
                       queryType: QueryType.UPDATE };
        this._queue.push(params);

        this._checkQueue();
    },

    updateBlank: function(query, cancellable, callback) {
        let params = { query: query,
                       cancellable: cancellable,
                       callback: callback,
                       queryType: QueryType.UPDATE_BLANK };
        this._queue.push(params);

        this._checkQueue();
    },

    _checkQueue: function() {
        if (this._running)
            return;

        if (!this._queue.length)
            return;

        let params = this._queue.shift();
        this._running = true;

        if (params.queryType == QueryType.SELECT)
            Application.connection.query_async(params.query, params.cancellable,
                                          Lang.bind(this, this._queueCollector, params));
        else if (params.queryType == QueryType.UPDATE)
            Application.connection.update_async(params.query, GLib.PRIORITY_DEFAULT, params.cancellable,
                                           Lang.bind(this, this._queueCollector, params));
        else if (params.queryType == QueryType.UPDATE_BLANK)
            Application.connection.update_blank_async(params.query, GLib.PRIORITY_DEFAULT, params.cancellable,
                                                 Lang.bind(this, this._queueCollector, params));
    },

    _queueCollector: function(connection, res, params) {
        params.callback(connection, res);
        this._running = false;
        this._checkQueue();
    }
});

const RefreshFlags = {
    NONE: 0,
    RESET_OFFSET: 1 << 0
};

const TrackerController = new Lang.Class({
    Name: 'TrackerController',

    _init: function(windowMode) {
        this._currentQuery = null;
        this._cancellable = new Gio.Cancellable();
        this._mode = windowMode;
        this._queryQueued = false;
        this._queryQueuedFlags = RefreshFlags.NONE;
        this._querying = false;
        this._isStarted = false;
        this._refreshPending = false;

        // useful for debugging
        this._lastQueryTime = 0;

        Application.sourceManager.connect('item-added', Lang.bind(this, this._onSourceAddedRemoved));
        Application.sourceManager.connect('item-removed', Lang.bind(this, this._onSourceAddedRemoved));

        Application.modeController.connect('window-mode-changed', Lang.bind(this,
            function(object, newMode) {
                if (this._refreshPending && newMode == this._mode)
                    this._refreshForSource();
            }));

        this._offsetController = this.getOffsetController();
        this._offsetController.connect('offset-changed', Lang.bind(this, this._performCurrentQuery));
    },

    getOffsetController: function() {
        log('Error: TrackerController implementations must override getOffsetController');
    },

    _setQueryStatus: function(status) {
        if (this._querying == status)
            return;

        if (status) {
            this._lastQueryTime = GLib.get_monotonic_time();
        } else {
            Utils.debug('Query Elapsed: '
                        + (GLib.get_monotonic_time() - this._lastQueryTime) / 1000000);
            this._lastQueryTime = 0;
        }

        this._querying = status;
        this.emit('query-status-changed', this._querying);
    },

    getQuery: function() {
        log('Error: TrackerController implementations must override getQuery');
    },

    getQueryStatus: function() {
        return this._querying;
    },

    _onQueryError: function(exception) {
        if (exception.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
            return;

        let message = _("Unable to fetch the list of documents");
        this.emit('query-error', message, exception);
    },

    _onQueryFinished: function(exception) {
        this._setQueryStatus(false);

        if (exception)
            this._onQueryError(exception);
        else
            this._offsetController.resetItemCount();

        if (this._queryQueued) {
            this._queryQueued = false;
            this._refreshInternal(this._queryQueuedFlags);
        }
    },

    _onCursorNext: function(cursor, res) {
        try {
            let valid = cursor.next_finish(res);

            if (!valid) {
                // signal the total count update and return
                cursor.close();
                this._onQueryFinished(null);
                return;
            }
        } catch (e) {
            cursor.close();
            this._onQueryFinished(e);
            return;
        }

        Utils.debug('Query Cursor: '
                    + (GLib.get_monotonic_time() - this._lastQueryTime) / 1000000);
        Application.documentManager.addDocumentFromCursor(cursor);
        cursor.next_async(this._cancellable, Lang.bind(this, this._onCursorNext));
    },

    _onQueryExecuted: function(object, res) {
        try {
            Utils.debug('Query Executed: '
                        + (GLib.get_monotonic_time() - this._lastQueryTime) / 1000000);

            let cursor = object.query_finish(res);
            cursor.next_async(this._cancellable, Lang.bind(this, this._onCursorNext));
        } catch (e) {
            this._onQueryFinished(e);
        }
    },

    _performCurrentQuery: function() {
        this._currentQuery = this.getQuery();
        this._cancellable.reset();

        Application.connectionQueue.add(this._currentQuery.sparql,
                                        this._cancellable, Lang.bind(this, this._onQueryExecuted));
    },

    _refreshInternal: function(flags) {
        this._isStarted = true;

        if (flags & RefreshFlags.RESET_OFFSET)
            this._offsetController.resetOffset();

        if (this.getQueryStatus()) {
            this._cancellable.cancel();
            this._queryQueued = true;
            this._queryQueuedFlags = flags;

            return;
        }

        this._setQueryStatus(true);
        this._performCurrentQuery();
    },

    refreshForObject: function(_object, _item) {
        this._refreshInternal(RefreshFlags.RESET_OFFSET);
    },

    _refreshForSource: function() {
        // When a source is added or removed, refresh the model only if
        // the current source is All.
        // If it was the current source to be removed, we will get an
        // 'active-changed' signal, so avoid refreshing twice
        if (this._currentQuery.activeSource &&
            this._currentQuery.activeSource.id == 'all')
            this._refreshInternal(RefreshFlags.NONE);

        this._refreshPending = false;
    },

    _onSourceAddedRemoved: function(manager, item) {
        let mode = Application.modeController.getWindowMode();

        if (mode == this._mode)
            this._refreshForSource();
        else
            this._refreshPending = true;
    },

    start: function() {
        if (this._isStarted)
            return;

        this._refreshInternal(RefreshFlags.NONE);
    }
});
Signals.addSignalMethods(TrackerController.prototype);
