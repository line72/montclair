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

import RouteType from './RouteType';
import GTFSWorker from './workers/gtfs-parser.worker';

class GTFSRTParser {
    constructor(name, gtfsUrl) {
        console.log('constructor', name, gtfsUrl);
        this.name = name;
        this.gtfsUrl = gtfsUrl;

        this.databases = {};
        this.databaseKeys = {};

        // create a web worker
        console.log('GTFSRTParser');
        this.jobId = 1;
        this.worker = null;
    }

    /**
     * Initialze the parser.
     *
     * This should be called Before calling any other method.
     *
     * @return Promise -> true
     */
    initialize() {
        console.log('initialize');
        return new Promise((success, failure) => {
            this.worker = new GTFSWorker();
            this.worker.onmessage = (e) => {
                console.log('got result message', e);
                this.databaseKeys = e.data.result;
                success(true);
            };
            console.log('GTFSRTParser is posting a message');
            this.worker.postMessage({
                id: this.jobId++,
                message: 'BUILD',
                data: {
                    name: this.name,
                    url: this.gtfsUrl
                }
            });
        });
    }

    /**
     * Get the routes.
     *
     * @return Promise -> map(Id,RouteType) : Returns a map of RouteTypes by Id
     */
    getRoutes() {
        console.log('getRoutes', this);
        const n = this.databaseKeys['routes'];
        if (!Object.keys(this.databases).includes(n)) {
            this.databases[n] = new PouchDB(n);
        }
        let db = this.databases[n];
        console.log('db=', db);

        return db.allDocs({include_docs: true})
            .then((results) => {
                console.log('results', results);
                return results.rows.map((row) => {
                    console.log(row);
                    return new RouteType({
                        id: row.doc.rId,
                        number: row.doc.number,
                        color: row.doc.color,
                        name: row.doc.name
                    });
                });
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
        return new Promise((success, failure) => {
            success([]);
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
        return new Promise((success, failure) => {
            success([]);
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
        return new Promise((success, failure) => {
            success([]);
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
        return new Promise((success, failure) => {
            success([]);
        });
    }
}

export default GTFSRTParser;
