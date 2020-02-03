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
        this.databases = {};

        this.KNOWN = [
            //'agency.txt',
            //'calendar.txt',
            //'calendar_dates.txt',
            //'fare_attributes.txt',
            //'fare_rules.txt',
            'routes.txt',
            //'shapes.txt',
            //'stop_times.txt',
            'stops.txt',
            //'trips.txt'
        ];
    }

    build() {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
                return JSZip.loadAsync(resp.arrayBuffer());
            }).then((unzipped) => {
                // just get the .txt files
                let promises = unzipped.file(/.*\.txt$/).map((zipObject) => {
                    // only worry about the files we care about
                    if (this.KNOWN.includes(zipObject.name)) {
                        console.log('ayncing', zipObject.name)
                        // create a new database
                        let name = zipObject.name.replace('.txt', '');
                        console.log('name', name);
                        const dbName = `${this.name}_${name}`;
                        let db = new PouchDB(dbName);
                        this.databases[dbName] = db;

                        const parseFn = this.getParseFn(name);
                        parseFn.setup(db);

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
                            let idx = 0;
                            try {
                                Papa.parse(streamer, {
                                    dynamicTyping: true,
                                    header: true,
                                    chunk: (row) => {
                                        console.log(zipObject.name, 'parsing', row);
                                        parseFn.parse(db, row.data, idx);
                                        idx += row.data.length;
                                    },
                                    complete: () => {
                                        console.log(zipObject.name, 'complete');
                                        resolve({key: name, db: dbName});
                                    }});
                                // start the streamer
                                streamer.resume();
                            } catch (e) {
                                console.log('error creating papa:', e);
                                reject(e);
                            }
                        });
                    } else {
                        console.log('skipping', zipObject.name)
                        return null;
                    }
                }).filter(x => !!x);
                console.log('promises=', promises, promises[0]);
                return Promise.all(promises).then((x) => {
                    return x.reduce((acc, y) => {
                        acc[y.key] = y.db;
                        return acc;
                    }, {});
                });
            });
    }

    getParseFn(name) {
        console.log('getParseFn', name);
        switch (name) {
        case 'routes':
            return {
                setup: this.setupDefault,
                parse: this.parseRoutes
            };
        case 'stops':
            return {
                setup: this.setupDefault,
                parse: this.parseStops
            };
        case 'trips':
            return {
                setup: this.setupTrips,
                parse: this.parseTrips
            };
        case 'stop_times':
            return {
                setup: this.setupStopTimes,
                parse: this.parseStopTimes
            }
        default:
            return {
                setup: this.setupDefault,
                parse: ((db, data, idx) => { })
            };
        }
    }

    setupDefault(db) {
    }

    setupTrips(db) {
        // create an index
        db.createIndex({
            index: {
                fields: ['route_id']
            }
        });
        db.createIndex({
            index: {
                fields: ['trip_id']
            }
        });
    }

    setupStopTimes(db) {
        // create an index
        db.createIndex({
            index: {
                fields: ['trip_id']
            }
        });
        db.createIndex({
            index: {
                fields: ['stop_id']
            }
        });
    }

    parseRoutes(db, rows, idx) {
        rows.map((row, i) => {
            const docId = `${idx+i}`;
            db.get(docId)
                .then((doc) => {
                    // update
                    return db.put({
                        _id: docId,
                        _rev: doc._rev,
                        rId: row.route_id,
                        number: row.route_short_name,
                        color: row.route_color,
                        name: row.route_long_name,
                        description: row.route_desc
                    });
                })
                .catch((err) => {
                    // new
                    return db.put({
                        _id: docId,
                        rId: row.route_id,
                        number: row.route_short_name,
                        color: row.route_color,
                        name: row.route_long_name,
                        description: row.route_desc
                    });
                })
                .then((resp) => {
                    return resp;
                }).catch((err) => {
                    console.log('Error inserting Route', idx, err);
                });
        });
    }

    parseStops(db, rows, idx) {
        rows.map((row, i) => {
            if (!row.stop_id) {
                console.warn('Invalid row', row);
                return;
            }

            const docId = `${idx+i}`;
            db.get(docId)
                .then((doc) => {
                    // update
                    return db.put({
                        _id: docId,
                        _rev: doc._rev,
                        sId: row.stop_id,
                        code: row.stop_code,
                        name: row.stop_name,
                        description: row.stop_description,
                        latitude: row.stop_lat,
                        longitude: row.stop_lon
                    });
                })
                .catch((err) => {
                    return db.put({
                        _id: docId,
                        sId: row.stop_id,
                        code: row.stop_code,
                        name: row.stop_name,
                        description: row.stop_description,
                        latitude: row.stop_lat,
                        longitude: row.stop_lon
                    });
                })
                .then((resp) => {
                    return resp;
                }).catch((err) => {
                    console.log('Error inserting Stop', idx, err);
                });
        });
    }

    parseTrips(db, rows, idx) {
        rows.map((row, i) => {
            if (!row.route_id) {
                console.log('parseTrips: Missing route_id');
                return;
            }

            const docId = `${idx+i}`;
            db.get(docId)
                .then((doc) => {
                    // update
                    return db.put({
                        _id: docId,
                        _rev: doc._rev,
                        route_id: row.route_id,
                        trip_id: row.trip_id,
                        shape_id: row.shape_id,
                        headsign: row.trip_headsign
                    });
                })
                .catch((err) => {
                    // create
                    return db.put({
                        _id: docId,
                        route_id: row.route_id,
                        trip_id: row.trip_id,
                        shape_id: row.shape_id,
                        headsign: row.trip_headsign
                    });
                })
                .then((resp) => {
                    return resp;
                }).catch((err) => {
                    console.log('Error inserting Trip', idx, err);
                });
        });
    }

    parseStopTimes(db, rows, idx) {
        rows.map((row, i) => {
            if (!row.trip_id) {
                return;
            }

            const docId = `${idx+i}`;
            db.get(docId)
                .then((doc) => {
                    // update
                    return db.put({
                        _id: docId,
                        _rev: doc._rev,
                        trip_id: row.trip_id,
                        stop_id: row.stop_id
                    });
                })
                .catch((err) => {
                    // create
                    return db.put({
                        _id: docId,
                        trip_id: row.trip_id,
                        stop_id: row.stop_id
                    });
                })
                .then((resp) => {
                    return resp;
                }).catch((err) => {
                    console.log('Error inserting StopTime', idx, err);
                });
        });
    }
}

export default Parser;
