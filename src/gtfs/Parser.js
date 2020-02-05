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
            'routes': new PouchDB(`${this.name}_routes`),
            'stops': new PouchDB(`${this.name}_stops`)
        };
    }

    build() {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
                return JSZip.loadAsync(resp.arrayBuffer());
        }).then(async (unzipped) => {
            try {
                let databases = {};
                const dbPrefix = this.name;
                databases['routes'] = `${dbPrefix}_routes`;
                databases['stops'] = `${dbPrefix}_stops`;

                const doParse = false;
                if (doParse) {
                    let state = {
                        shapes: {},
                        routes: {}
                    };

                    console.log('starting destroy');
                    await this.destroyDatabases();
                    console.log('doing create');
                    await this.createDatabases();

                    // parse each file in order
                    console.log('parsing routes');
                    const routesObject = unzipped.file('routes.txt');
                    await this.parse(routesObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseRoutes(this.databases['routes'], rows, idx));

                    console.log('parsing stops');
                    const stopsObject = unzipped.file('stops.txt');
                    await this.parse(stopsObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseStops(this.databases['stops'], rows, idx));

                    console.log('parsing shapes');
                    const shapesObject = unzipped.file('shapes.txt');
                    await this.parse(shapesObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseShapes(state, rows, idx),
                                     () => this.completeShapes(state));

                    console.log('parsing trips');
                    const tripsObject = unzipped.file('trips.txt');
                    await this.parse(tripsObject,
                                     this.setupDefault,
                                     (rows, idx) => this.parseTrips(state, rows, idx),
                                     () => this.completeTrips(state, this.databases['routes']));
                    // clean up the shapes state
                    state.shapes = {};

                    console.log('parsing stop times');
                    const stopTimesObject = unzipped.file('stop_times.txt');

                    // !mwd - TODO: close all the database

                    // return the db keys
                    console.log('done', databases);
                    return databases;
                } else {
                    console.log('skipping parsing');

                    return databases;
                }

            } catch (e) {
                console.log('Parser.build: Error:', e);

                // !mwd - TODO: close all the database


                throw e;
            }
            });
    }

    createDatabases() {
        // create indexes
        return new Promise((resolve, reject) => {
            this.databases = {
                'routes': new PouchDB(`${this.name}_routes`),
                'stops': new PouchDB(`${this.name}_stops`)
            };

            resolve(this.databases);
        });
    }

    destroyDatabases() {
        let promises = Object.keys(this.databases).map((k) => {
            console.log('destroying', k);
            return this.databases[k].destroy()
                .then((r) => {
                    console.log('destroyed', k);
                    return r;
                });
        });
        return Promise.all(promises);
    }

    parse(zipObject, setupFn, parseFn, completeFn) {
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
                console.log('read is being called!');
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
                    dynamicTyping: true,
                    header: true,
                    chunk: (row, parser) => {
                        try {
                            parser.pause();
                            parseFn(row.data, idx).then((r) => {
                                parser.resume();
                            }).catch((e) => {
                                console.log('Error parsing', e);
                                parser.abort();
                            });

                            idx += row.data.length;
                        } catch (e) {
                            console.log('Error during parsing', zipObject.name, e);
                            parser.abort();
                        }
                    },
                    complete: () => {
                        console.log(zipObject.name, 'complete');
                        if (completeFn) {
                            completeFn().then(() => {
                                resolve(true);
                            }).catch((err) => {
                                console.warn('Error in complete', err);
                                reject(err);
                            });
                        } else {
                            resolve(true);
                        }
                    }});
                // start the streamer
                streamer.resume();
            } catch (e) {
                console.log('error creating papa:', e);
                reject(e);
            }
        });
    }

    /** Setup functions **/
    setupDefault() {
    }

    /** Parse functions **/
    parseRoutes(db, rows, idx) {
        let docs = rows.map((row, i) => {
            return {
                _id: `${row.route_id}`,
                rId: row.route_id,
                number: row.route_short_name,
                color: row.route_color,
                name: row.route_long_name,
                description: row.route_desc
            };
        });

        return db.bulkDocs(docs)
            .then((resp) => {
                console.log('Inserted routes', idx);
                return resp;
            })
            .catch((err) => {
                console.log('Error inserting Routes', err);
            });
    }

    parseStops(db, rows, idx) {
        let docs = rows.map((row, i) => {
            if (!row.stop_id) {
                console.warn('parseStops: Invalid row', row);
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
                console.log('Error inserting Stops', err);
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
                        trips: new Set(),
                        shapes: new Set()
                    };
                }
                state.routes[row.route_id].trips.add(`${row.trip_id}`);
                state.routes[row.route_id].shapes.add(row.shape_id);
            }

            resolve([]);
        });
    }

    parseStopTimes(db, rows, idx) {
        let docs = rows.map((row, i) => {
            if (!row.trip_id) {
                return null;
            }

            return {
                trip_id: row.trip_id,
                stop_id: row.stop_id
            };
        }).filter(x => !!x);

        console.log('Bulk StopTimes', idx, docs.length);
        return db.bulkDocs(docs)
            .then((resp) => {
                console.log('Inserted StopTimes', idx);
                return resp;
            })
            .catch((err) => {
                console.log('Error inserting StopTimes', err);
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
        console.log('completeTrips', state.routes);
        // update all the routes
        return routesDB.allDocs({include_docs: true}).then((results) => {
            let docs = results.rows.map((row) => {
                const tripId = parseInt(row.id);
                return {
                    ...row.doc,
                    trips: [...state.routes[tripId].trips],
                    shapes: [...state.routes[tripId].shapes].map(s => state.shapes[s].points)
                };
            });

            return routesDB.bulkDocs(docs)
                .then((resp) => {
                    return resp;
                })
                .catch((err) => {
                    console.log('Error inserting trips', err);
                });
        });
    }
}

export default Parser;
