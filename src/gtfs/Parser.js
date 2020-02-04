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
    }

    build() {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
                return JSZip.loadAsync(resp.arrayBuffer());
        }).then(async (unzipped) => {
            try {
                let databases = {};
                const dbPrefix = this.name;

                // parse each file in order
                console.log('parsing routes');
                const routesObject = unzipped.file('routes.txt');
                databases['routes'] = await this.parse(routesObject, `${dbPrefix}_routes`,
                                                       this.setupDefault, this.parseRoutes);

                console.log('parsing stops');
                const stopsObject = unzipped.file('stops.txt');
                databases['stops'] = await this.parse(stopsObject, `${dbPrefix}_stops`,
                                                      this.setupDefault, this.parseStops);

                // return the db keys
                console.log('done', databases);
                return databases;
            } catch (e) {
                console.log('Parser.build: Error:', e);
                throw e;
            }
        });
            //     // just get the .txt files
            //     const files = ['routes.txt', 'trips.txt', 'stops.txt'];
            //     //let promises = unzipped.file(/.*\.txt$/).map((zipObject) => {
            //     let promises = files.map(async (f) => {
            //         const zipObject = unzipped.file(f);
            //         console.log('loading', zipObject.name)
            //         // create a new database
            //         let name = zipObject.name.replace('.txt', '');
            //         const dbName = `${this.name}_${name}`;
            //         let db = new PouchDB(dbName);
            //         this.databases[dbName] = db;

            //         const result = await db.info().then(async (result) => {
            //             if (result.doc_count == 0) {
            //                 // do stuff
            //                 const result = await this.doParse(zipObject, db, dbName, name);
            //                 return result;
            //             } else {
            //                 // nothing to do
            //                 console.log(zipObject.name, 'already complete');
            //                 return {key: name, db: dbName};
            //             }
            //         });
            //         console.log('got result');
            //         return result;
            //     }).filter(x => !!x);
            //     console.log('promises=', promises, promises[0]);
            //     return Promise.all(promises).then((x) => {
            //         return x.reduce((acc, y) => {
            //             acc[y.key] = y.db;
            //             return acc;
            //         }, {});
            //     });
            // });
    }

    parse(zipObject, dbName, setupFn, parseFn) {
        let db = new PouchDB(dbName);
        this.databases[dbName] = db;

        return db.info()
            .then((result) => {
                if (result.doc_count == 0) {
                    return this.doParse(db, zipObject, dbName, setupFn, parseFn);
                } else {
                    return dbName;
                }
            });
    }

    doParse(db, zipObject, dbName, setupFn, parseFn) {
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
            setupFn(db);

            let idx = 0;
            try {
                Papa.parse(streamer, {
                    dynamicTyping: true,
                    header: true,
                    chunk: (row, parser) => {
                        console.log(zipObject.name, 'parsing', row);
                        parser.pause();
                        parseFn(db, row.data, idx).then((r) => {
                            parser.resume();
                        }).catch((e) => {
                            console.log('Error parsing', e);
                            parser.abort();
                        });

                        idx += row.data.length;
                    },
                    complete: () => {
                        console.log(zipObject.name, 'complete');
                        resolve(dbName);
                    }});
                // start the streamer
                streamer.resume();
            } catch (e) {
                console.log('error creating papa:', e);
                reject(e);
            }
        });
    }

    // getParseFn(name) {
    //     console.log('getParseFn', name);
    //     switch (name) {
    //     case 'routes':
    //         return {
    //             setup: this.setupDefault,
    //             parse: this.parseRoutes
    //         };
    //     case 'stops':
    //         return {
    //             setup: this.setupDefault,
    //             parse: this.parseStops
    //         };
    //     case 'trips':
    //         return {
    //             setup: this.setupTrips,
    //             parse: this.parseTrips
    //         };
    //     case 'stop_times':
    //         return {
    //             setup: this.setupStopTimes,
    //             parse: this.parseStopTimes
    //         }
    //     default:
    //         return {
    //             setup: this.setupDefault,
    //             parse: ((db, data, idx) => { })
    //         };
    //     }
    // }

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
        console.log('inserting Routes', idx);
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
                console.log('parseStops insert complete');
                return resp;
            })
            .catch((err) => {
                console.log('Error inserting Stops', err);
            });
    }

    parseTrips(db, rows, idx) {
        let docs = rows.map((row, i) => {
            if (!row.route_id) {
                console.log('parseTrips: Missing route_id');
                return null;
            }

            return {
                route_id: row.route_id,
                trip_id: row.trip_id,
                shape_id: row.shape_id,
                headsign: row.trip_headsign
            };
        }).filter(x => !!x);

        return db.bulkDocs(docs)
            .catch((err) => {
                console.log('Error inserting Trips', err);
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
}

export default Parser;
