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

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

import RouteType from './RouteType';
import StopType from './StopType';
import VehicleType from './VehicleType';
import ArrivalType from './ArrivalType';
import GTFSWorker from './workers/gtfs-parser.worker';

PouchDB.plugin(PouchDBFind);

class GTFSRTParser {
    constructor(name, gtfsUrl, vehiclePositionsUrl, tripUpdatesUrl) {
        this.name = name;
        this.gtfsUrl = gtfsUrl;
        this.vehiclePositionsUrl = vehiclePositionsUrl;
        this.tripUpdatesUrl = tripUpdatesUrl;

        this.databases = {};
        this.databaseKeys = {};

        // create a web worker
        this.jobs = {};
        this.jobId = 1;
        this.worker = new GTFSWorker();
        this.worker.onmessage = (e) => {
            if (e.data.id in this.jobs) {
                let cb = this.jobs[e.data.id];
                delete this.jobs[e.data.id];

                cb(e);
            } else {
                console.warn('GTFSRTParser: got message with unknown id', e.data.id);
            }
        };
    }

    /**
     * Initialze the parser.
     *
     * This should be called Before calling any other method.
     *
     * @return Promise -> true
     */
    initialize() {
        return this.postWorkerMessage('BUILD', {name: this.name, url: this.gtfsUrl})
            .then((result) => {
                this.databaseKeys = result;

                // start the vehicle update.
                // We never get a response from this message, so
                //  just post it directly
                this.worker.postMessage({
                    id: this.jobId++,
                    message: 'VEHICLE_UPDATE_START',
                    data: {
                        dbName: this.databaseKeys['routes'],
                        url: this.vehiclePositionsUrl,
                    }
                });

                return true;
            });
    }

    openDB(name) {
        const n = this.databaseKeys[name];
        if (!Object.keys(this.databases).includes(n)) {
            this.databases[n] = new PouchDB(n);
        }
        let db = this.databases[n];
        return db;
    }

    /**
     * Get the routes.
     *
     * Available options:
     *  - parseNameFn :: (str) -> str :: This can transform the route name
     *
     * @return Promise -> map(Id,RouteType) : Returns a map of RouteTypes by Id
     */
    getRoutes(options) {
        let db = this.openDB('routes');

        return db.allDocs({include_docs: true})
            .then((results) => {
                return Promise.all(results.rows.map((row) => {
                    let parseName = (n) => {
                        if (options && options.parseNameFn) {
                            return options.parseNameFn(n);
                        }
                        return n;
                    };

                    return new RouteType({
                        id: row.doc.rId,
                        number: row.doc.number,
                        color: row.doc.color.trim() || 'ff0000',
                        name: parseName(row.doc.name),
                        polyline: row.doc.shapes
                    });
                }));
            })
            .then((routes) => {
                return routes.reduce((acc, route) => {
                    acc[route.id] = route;
                    return acc;
                }, {});
            });
    }

    /**
     * Get the stops for a specific route.
     *
     * @param route -> (RouteType) : The route to get the stops for
     * @return Promise -> [StopType] : Returns a list of StopTypes
     */
    getStopsFor(route) {
        let routesDB = this.openDB('routes');
        let stopsDB = this.openDB('stops');

        return routesDB.get(`${route.id}`)
            .then((r) => {
                const stopKeys = r.stop_ids.map(x => `${x}`);
                return stopsDB.allDocs({include_docs: true,
                                        keys: stopKeys})
                    .then((stops) => {
                        return stops.rows.map((stop) => {
                            return new StopType({
                                id: stop.doc.sId,
                                name: stop.doc.name,
                                position: [stop.doc.latitude, stop.doc.longitude]
                            });
                        });
                    });
            });
    }

    /**
     * Get the arrivals for a stop
     *
     * @param stopId -> String : The id of the stop
     * @param routes -> map(RouteType) : The dictionary of routes
     * @return Promise -> [ArrivalType] : in sorted order
     */
    getArrivalsFor(stopId, routes) {
        return this.postWorkerMessage('FETCH_STOP_ESTIMATES', {
            url: this.tripUpdatesUrl,
            stopId: stopId
        }).then((result) => {
            let arrivals = () => {
                if (stopId in result) {
                    return result[stopId].map((e) => {
                        return new ArrivalType({
                            route: routes[e.routeId],
                            direction: '',
                            arrival: e.arrival * 1000, /* convert from seconds to ms */
                            vehicleId: e.vehicleId,
                            tripId: e.tripId
                        });
                    });
                } else {
                    return [];
                }
            };

            // sort based on arrival time
            return arrivals().sort((a, b) => {
                if (a.arrival.isBefore(b.arrival)) {
                    return -1;
                } else if (a.arrival.isSame(b.arrival)) {
                    return 0;
                } else {
                    return 1;
                }
            });
        });
    }

    /**
     * Get the vehicles for an area or a list of routes
     *
     * @param bounds -> ([LatLng]) : The leaflef bounds of the map
     * @param visible_routes -> ([RouteType]) : The list of routes
     * @return Promise -> map(RouteId,VehicleType) : Returns a map of VehicleType by RouteId
     */
    getVehicles(bounds, visible_routes) {
        let db = this.openDB('routes');

        return db.allDocs({include_docs: true,
                           keys: visible_routes.map(x => `${x.id}`)})
            .then((routes) => {
                return routes.rows.reduce((acc, route) => {
                    let vehicles = route.doc.vehicles.map((v) => {
                        return new VehicleType({
                            id: v.id,
                            position: v.position,
                            heading: v.bearing,
                            color: route.doc.color,
                            route_id: route.doc.rId
                        });
                    });

                    acc[route.doc.rId] = vehicles;
                    return acc;
                }, {});
            });
    }

    /**
     * Get a specific vehicle on a specific route
     *
     * @param route -> RouteType : The route
     * @param vehicleId -> String : The id of the vehicle, this matches the Trip's BlockFareboxId
     * @return Promise -> VehicleType | nil : The vehicle if found
     */
    getVehicle(route, vehicleId) {
        let db = this.openDB('routes');

        return db.get(`${route.id}`)
            .then((r) => {
                let v = r.vehicles.find((v) => {
                    return v.id === vehicleId;
                });

                if (v) {
                    return new VehicleType({
                        id: v.id,
                        position: v.position,
                        heading: v.bearing,
                        color: route.color,
                        route_id: route.id
                    });
                } else {
                    return null;
                }
            });
    }

    postWorkerMessage(message_type, data) {
        let promise = new Promise((resolve, reject) => {
            this.jobs[this.jobId] = (result) => {
                if (result.data.status) {
                    resolve(result.data.result);
                } else {
                    reject(result.data.result);
                }
            };

            this.worker.postMessage({
                id: this.jobId++,
                message: message_type,
                data: data
            });
        });

        return promise;

    }
}

export default GTFSRTParser;
