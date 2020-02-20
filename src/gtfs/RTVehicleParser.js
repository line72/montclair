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

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);

/**
 * Parser for the GTFS-RT Vehicle Locations
 *
 * https://developers.google.com/transit/gtfs-realtime/guides/vehicle-positions
 */
class RTVehicleParser {
    constructor(dbName, url) {
        this.url = url;
        this.db = new PouchDB(dbName, { auto_compaction: true });
    }

    /**
     * Update the locations async and store
     *  them in the DB.
     *
     * @return Promise -> true | false
     */
    update() {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
            return resp.arrayBuffer();
        })
            .then((ab) => {
                let msg = new Uint8Array(ab);
                let feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(msg);
                let vehicles = feed.entity.reduce((acc, entity) => {
                    if (entity.vehicle && entity.vehicle.trip) {
                        let position = [entity.vehicle.position.latitude,
                                        entity.vehicle.position.longitude];
                        let bearing = entity.vehicle.position.bearing;
                        let routeId = `${entity.vehicle.trip.routeId}`;
                        let vehicleId = `${entity.vehicle.vehicle.id}`;
                        let nextStop = `${entity.vehicle.stopId}`;

                        if (!(routeId in acc)) {
                            acc[routeId] = [];
                        }

                        acc[routeId].push({
                            id: vehicleId,
                            position: position,
                            bearing: bearing
                        });
                    } else {
                        // skip
                    }

                    return acc;
                }, {});

                // update the database.
                return this.db.allDocs({include_docs: true,
                                        keys: Object.keys(vehicles)})
                    .then((routes) => {
                        // insert the vehicle locations into the route.
                        let updates = routes.rows.map((route) => {
                            return {
                                ...route.doc,
                                vehicles: vehicles[route.doc.rId]
                            };
                        });

                        return this.db.bulkDocs(updates);
                    });
            })
            .then((resp) => {
                return true;
            })
            .catch((e) => {
                console.warn('Gtfs.RTVehicleParser.update: Error updating vehicle locations', e);
                return true;
            });
    }
};

export default RTVehicleParser;
