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

const Lang = imports.lang;

const QueryColumns = {
    URN: 0,
    URI: 1,
    TITLE: 2,
    URL: 3,
    DATE_CREATED: 4,
    DATE: 5,
    IS_READ: 6,
    DATE_RECEIVED: 7,
    DOWNLOADED_TIME: 8,
};

const QueryBuilder = new Lang.Class({
    Name: 'QueryBuilder',

    _createQuery: function(sparql) {
        return {
            sparql: sparql,
        };
    },

    buildFetchNewArticlesQuery: function(limit) {
        let sparql =
            ('SELECT DISTINCT ?urn' + // urn
             '  nie:url(?urn) ' + // uri
             '  nie:title(?urn) ' + // title
             '  nie:url(?urn) ' + // url
             '  nie:contentCreated(?urn) ' +
             '  nie:informationElementDate(?urn) ' +
             '  nmo:isRead(?urn) ' +
             '  nmo:receivedDate(?urn) '+
             '  mfo:downloadedTime(?urn) ' +
             'WHERE {' +
             '  ?urn a mfo:FeedMessage;' +
             '  nmo:isRead false . ' +
             '} ' +
             'ORDER BY DESC(nie:contentCreated(?urn)) ' +
             'LIMIT ' + limit);

        return this._createQuery(sparql);
    },
});
