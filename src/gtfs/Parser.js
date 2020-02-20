/* -*- Mode: rjsx -*- */

/*******************************************
 * Copyright (2020)
 *  Marcus Dillavou <line72@line72.net>
 *  http://line72.net
 *
 * Montclair:
 *  https://github.com/line72/montclair
 *  https://montclair.line72.net
 *
 * Licensed Under the GPLv3
 *******************************************/

import JSZip from 'jszip';
import Papa from 'papaparse';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

class Parser {
    constructor(name, url) {
        this.name = name;
        this.url = url;
        // create the database
        this.databases = {
            'info': new PouchDB(`${this.name}_info`, { auto_compaction: true }),
            'routes': new PouchDB(`${this.name}_routes`, { auto_compaction: true }),
            'stops': new PouchDB(`${this.name}_stops`, { auto_compaction: true })
        };

        // specify some parsing options, specifically,
        //  which fields we want papaParse to dynmically type
        this.parsingOptions = {
            routes: {route_id: false, agency_id: false, route_short_name: false,
                     route_long_name: false, route_desc: false, route_type: true,
                     route_url: false, route_color: false, route_text_color: false},
            stops: {stop_id: false, stop_code: false, stop_name: false,
                    stop_desc: false, stop_lat: true, stop_lon: true,
                    zone_id: false, stop_url: false, location_type: false,
                    parent_station: false, stop_timezone: false, wheelchair_boarding: false},
            shapes: {shape_id: false, shape_pt_lon: true, shape_pt_lat: true,
                     shape_pt_sequence: true, shape_dist_traveled: true},
            trips: {route_id: false, service_id: true, trip_id: false,
                    direction_id: true, block_id: false, shape_id: false},
            stop_times: {trip_id: false, arrival_time: true, departure_time: true,
                         stop_id: false, stop_sequence: true, stop_headsign: false,
                         pickup_type: true, drop_off_type: true, shape_dist_traveled: true,
                         timepoint: true}
        };
    }

    build() {
        let databases = {};
        const dbPrefix = this.name;
        databases['routes'] = `${dbPrefix}_routes`;
        databases['stops'] = `${dbPrefix}_stops`;

        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
            return this.databases['info'].get('info')
                .then((doc) => {
                    let contentLength = resp.headers.get('content-length');
                    let etag = resp.headers.get('etag');

                    if (doc.contentLength === contentLength && doc.etag == etag) {
                        return databases;
                    } else {
                        console.log('Gtfs.Parser: GTFS data has changed, rebuilding...');
                        return this.load(resp, databases);
                    }
                })
                .catch((err) => {
                    console.log('Gtfs.Parser: No database exists, building...');
                    // no info has been created yet.
                    //  This is the first time.
                    return this.load(resp, databases);
                });
        });
    }

    load(resp, databases) {
        let contentLength = resp.headers.get('content-length');
        let etag = resp.headers.get('etag');

        return JSZip.loadAsync(resp.arrayBuffer())
            .then(async (unzipped) => {
                try {
                    let state = {
                        shapes: {},
                        trips: {},
                        routes: {}
                    };

                    await this.destroyDatabases();
                    await this.createDatabases();

                    // parse each file in order
                    const routesObject = unzipped.file('routes.txt');
                    await this.parse(routesObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseRoutes(state, this.databases['routes'], rows, idx),
                                     null, this.parsingOptions['routes']);

                    const stopsObject = unzipped.file('stops.txt');
                    await this.parse(stopsObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseStops(this.databases['stops'], rows, idx),
                                     null, this.parsingOptions['stops']);

                    const shapesObject = unzipped.file('shapes.txt');
                    await this.parse(shapesObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseShapes(state, rows, idx),
                                     () => this.completeShapes(state),
                                     this.parsingOptions['shapes']);

                    const tripsObject = unzipped.file('trips.txt');
                    await this.parse(tripsObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseTrips(state, rows, idx),
                                     () => this.completeTrips(state, this.databases['routes']),
                                    this.parsingOptions['trips']);
                    // clean up the shapes state
                    state.shapes = {};

                    const stopTimesObject = unzipped.file('stop_times.txt');
                    await this.parse(stopTimesObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseStopTimes(state, rows, idx),
                                     () => this.completeStopTimes(state, this.databases['routes']),
                                     this.parsingOptions['stop_times']);

                    // finally the info
                    await this.databases['info'].put({
                        _id: 'info',
                        contentLength: contentLength,
                        etag: etag
                    });

                    // !mwd - TODO: close all the database

                    // return the db keys
                    return databases;
                } catch (e) {
                    console.error('Gtfs.Parser.build: Error:', e);

                    // !mwd - TODO: close all the database

                    throw e;
                }
            });
    }

    createDatabases() {
        // create indexes
        return new Promise((resolve, reject) => {
            this.databases = {
                'info': new PouchDB(`${this.name}_info`, { auto_compaction: true }),
                'routes': new PouchDB(`${this.name}_routes`, { auto_compaction: true }),
                'stops': new PouchDB(`${this.name}_stops`, { auto_compaction: true })
            };

            resolve(this.databases);
        });
    }

    destroyDatabases() {
        let promises = Object.keys(this.databases).map((k) => {
            return this.databases[k].destroy()
                .then((r) => {
                    return r;
                }).catch((e) => {
                    console.log('Gtfs.Parser: Error destroying database', k, e);
                    return true;
                });
        });
        return Promise.all(promises);
    }

    parse(zipObject, setupFn, parseFn, completeFn, dynamicTyping = true) {
        const stream = zipObject.internalStream('text');

        /**
         * !mwd - Create something that looks like
         *  what papaparser wants for a ReadableStreamStreamer/ChunkStreamer.
         *  Unfortunately, this isn't a documented thing, so I just had
         *  to figure out what it was doing internally and implement what
         *  it needed:
         * https://github.com/mholt/PapaParse/blob/master/papaparse.js#L808
         */
        function Streamer(s) {
            this.stream = s;
            this.readable = true;
            this.cb = {'data': null,
                       'end': null,
                       'error': null};

            this.on = function(t, cb) {
                this.cb[t] = cb;
            };

            this.removeListener = function(t, cb) {
                this.cb[t] = null;
            };

            this.read = function() {

            };

            this.pause = function() {
                this.stream.pause();
            };

            this.resume = function() {
                this.stream.resume();
            };

            this.stream.on('data', (data) => {
                if (this.cb.data) {
                    this.cb.data(data);
                }
            });
            this.stream.on('end', (data) => {
                if (this.cb.end) {
                    this.cb.end(data);
                }
            });
            this.stream.on('error', (data) => {
                if (this.cb.error) {
                    this.cb.error(data);
                }
            });
        };
        const streamer = new Streamer(stream);

        return new Promise((resolve, reject) => {
            // set up the db
            setupFn();

            let idx = 0;
            try {
                Papa.parse(streamer, {
                    dynamicTyping: dynamicTyping,
                    header: true,
                    chunk: (row, parser) => {
                        try {
                            parser.pause();
                            parseFn(row.data, idx).then((r) => {
                                parser.resume();
                            }).catch((e) => {
                                console.error('Gtfs.Parser.parse: Error parsing chunk', e);
                                parser.abort();
                            });

                            idx += row.data.length;
                        } catch (e) {
                            console.error('Gtfs.Parser.parse: Error during parsing', zipObject.name, e);
                            parser.abort();
                        }
                    },
                    complete: () => {
                        if (completeFn) {
                            completeFn().then(() => {
                                resolve(true);
                            }).catch((err) => {
                                console.error('Gtfs.Parser.parse: Error in complete', err);
                                reject(err);
                            });
                        } else {
                            resolve(true);
                        }
                    }});
                // start the streamer
                streamer.resume();
            } catch (e) {
                console.error('Gtfs.Parser.parse: Error creating papa, maybe an invalid CSV?', e);
                reject(e);
            }
        });
    }

    /** Setup functions **/
    setupDefault() {
    }

    /** Parse functions **/
    parseRoutes(state, db, rows, idx) {
        let docs = rows.map((row, i) => {
            if (!(row.route_id in state.routes)) {
                state.routes[row.route_id] = {
                    stops: new Set(),
                    trips: new Set(),
                    shapes: new Set()
                };
            }

            return {
                _id: `${row.route_id}`,
                rId: row.route_id,
                number: row.route_short_name,
                color: row.route_color,
                name: row.route_long_name,
                description: row.route_desc,
                trip_ids: [],
                shapes: [],
                vehicles: []
            };
        });

        return db.bulkDocs(docs)
            .then((resp) => {
                return resp;
            })
            .catch((err) => {
                console.warn('Gtfs.Parser.parseRoutes: Error inserting Routes', err);
                throw err;
            });
    }

    parseStops(db, rows, idx) {
        let docs = rows.map((row, i) => {
            if (!row.stop_id) {
                return null;
            }

            return {
                _id: `${row.stop_id}`,
                sId: row.stop_id,
                code: row.stop_code,
                name: row.stop_name,
                description: row.stop_description,
                latitude: row.stop_lat,
                longitude: row.stop_lon
            };
        }).filter(x => !!x);

        return db.bulkDocs(docs)
            .then((resp) => {
                return resp;
            })
            .catch((err) => {
                console.log('Gtfs.Parser.parseStops: Error inserting Stops', err);
                throw err;
            });
    }

    parseTrips(state, rows, idx) {
        return new Promise((resolve, reject) => {
            for (let row of rows) {
                if (!row.route_id) {
                    break;
                }

                if (!(row.route_id in state.routes)) {
                    state.routes[row.route_id] = {
                        stops: new Set(),
                        trips: new Set(),
                        shapes: new Set()
                    };
                }
                state.routes[row.route_id].trips.add(row.trip_id);
                state.routes[row.route_id].shapes.add(row.shape_id);

                // store the route for a trip
                state.trips[row.trip_id] = row.route_id;
            }

            resolve([]);
        });
    }

    parseStopTimes(state, rows, idx) {
        return new Promise((resolve, reject) => {
            for (let row of rows) {
                if (!row.trip_id) {
                    break;
                }

                state.routes[state.trips[row.trip_id]].stops.add(row.stop_id);
            }

            resolve([]);
        });
    }

    parseShapes(state, rows, idx) {
        return new Promise((resolve, reject) => {
            for (let row of rows) {
                if (!row.shape_id) {
                    break;
                }

                if (!(row.shape_id in state.shapes)) {
                    state.shapes[row.shape_id] = {
                        points: []
                    };
                }

                const idx = row.shape_pt_sequence - 1;
                state.shapes[row.shape_id].points[idx] = [row.shape_pt_lat,
                                                          row.shape_pt_lon];
            }

            resolve([]);
        });
    }

    /** completion functions **/

    completeShapes(shapesState) {
        return new Promise((resolve, reject) => {
            resolve([]);
        });
    }

    completeTrips(state, routesDB) {
        // update all the routes
        return routesDB.allDocs({include_docs: true}).then((results) => {
            let docs = results.rows.map((row) => {
                const routeId = row.id;
                return {
                    ...row.doc,
                    trip_ids: [...state.routes[routeId].trips],
                    shapes: [...state.routes[routeId].shapes].map(s => state.shapes[s].points)
                };
            });

            return routesDB.bulkDocs(docs)
                .then((resp) => {
                    return resp;
                })
                .catch((err) => {
                    console.warn('Gtfs.Parser.completeTrips: Error inserting trips', err);
                    throw err;
                });
        });
    }

    completeStopTimes(state, routesDB) {
        // update all the routes
        return routesDB.allDocs({include_docs: true}).then((results) => {
            let docs = results.rows.map((row) => {
                const routeId = row.id;
                return {
                    ...row.doc,
                    stop_ids: [...state.routes[routeId].stops]
                };
            });

            return routesDB.bulkDocs(docs)
                .then((resp) => {
                    return resp;
                })
                .catch((err) => {
                    console.warn('Gtfs.Parser.completeStopTimes: Error inserting stop times', err);
                    throw err;
                });
        });
    }
}

export default Parser;
