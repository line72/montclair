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

class Parser {
    constructor(name, url) {
        this.name = name;
        this.url = url;
        // create the database
        this.databases = {};

        this.KNOWN = [
            'agency.txt',
            //'calendar.txt',
            //'calendar_dates.txt',
            //'fare_attributes.txt',
            //'fare_rules.txt',
            'routes.txt',
            'shapes.txt',
            //'stop_times.txt',
            'stops.txt',
            'trips.txt'
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

                        return zipObject.async('text')
                            .then((success) => {
                                // console.log('success', success);
                                return new Promise((resolve, reject) => {
                                    let idx = 0;
                                    console.log('starting parser');
                                    Papa.parse(success, {
                                        dynamicTyping: true,
                                        header: true,
                                        step: (row) => {
                                            if (idx < 1) {
                                                console.log(zipObject.name, 'parsing', row);
                                            }
                                            parseFn(db, row.data, idx);
                                            idx += 1;
                                        },
                                        complete: () => {
                                            console.log(zipObject.name, 'complete');
                                            resolve({key: name, db: dbName});
                                        }});
                                });
                            }, (err) => {
                                console.log('err', err);
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
            return this.parseRoutes;
        case 'stops':
            return this.parseStops;
        default:
            return ((db, data, idx) => { });
        }
    }

    parseRoutes(db, row, idx) {
        console.log('parseRoutes', idx);
        const docId = `${idx}`;
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
                    description: row.route_description
                });
            })
            .catch((err) => {
                // new
                return db.put({
                    _id: docId,
                    rId: row.route_id,
                    color: row.route_color,
                    name: row.route_short_name,
                    description: row.route_long_name
                });
            })
            .then((resp) => {
                return resp;
            }).catch((err) => {
                console.log('Error inserting Route', idx, err);
            });
    }

    parseStops(db, row, idx) {
        if (!row.stop_id) {
            console.warn('Invalid row', row);
            return;
        }

        const docId = `${idx}`;
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
    }
}

export default Parser;
