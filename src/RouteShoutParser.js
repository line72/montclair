/* -*- Mode: rjsx -*- */

/*******************************************
 * Copyright (2019)
 *  Marcus Dillavou <line72@line72.net>
 *  http://line72.net
 *
 * Montclair:
 *  https://github.com/line72/montclair
 *  https://montclair.line72.net
 *
 * Licensed Under the GPLv3
 *******************************************/

import axios from 'axios';

import RouteType from './RouteType';
import VehicleType from './VehicleType';

class RouteShoutParser {
    constructor(key, agency_id, routematch_url, route_list) {
        // !mwd - There are two APIs that we need to use.
        //  The first is the RouteShout API which lets us find
        //  the agency, then get information, like the list of
        //  routes. However, the RouteShout API doesn't have
        //  real time vehicle location, so we have to use
        //  a second service for that.
        // Unfortunately, I am still waiting on an API key
        //  from route shout, so I can't actually test it, so
        //  for now, I am requiring the route information to
        //  be passed in, and only using the second api
        //  for getting vehicle locations.
        this.url = 'http://api.routeshout.com/v1/';
        this.key = key;
        this.agency_id = agency_id;
        this.routematch_url = routematch_url;

        // Route List
        this.routes = route_list

        this.requestor2 = axios.create({
            baseURL: this.routematch_url
        });
    }

    /**
     * Initialze the parser.
     *
     * This should be called Before calling any other method.
     *
     * @return Promise -> true
     */
    initialize() {
        return new Promise((success, failure) => {
            success(true);
        });
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
        // !mwd - TODO, will need to use routeshout api to
        //  get this list
        return new Promise((resolve, reject) => {
            const requests = this.routes.map((r) => {
                const [number, name, idx, color] = r;
                const url = `/feed/landRoute/byRoute/${idx}`;
                return this.requestor2.get(url).then((response) => {
                    // generate a list of lat/long as a polyine
                    const polyline = this.generatePolyline(response.data);

                    let parseName = (n) => {
                        if (options && options.parseNameFn) {
                            return options.parseNameFn(n);
                        }
                        return n;
                    };
                    
                    return new RouteType({
                        id: idx,
                        number: number,
                        name: parseName(name),
                        color: color,
                        polyline: polyline
                    });
                });
            });

            Promise.all(requests).then((results) => {
                const route_data = results.reduce((acc, result) => {
                    acc[result.id] = result;

                    return acc;
                }, {});

                resolve(route_data);
            });
        });
    }

    /**
     * Get the stops for a specific route.
     *
     * @param route -> (RouteType) : The route to get the stops for
     * @return Promise -> [StopType] : Returns a list of StopTypes
     */
    getStopsFor(route) {
        // !mwd - TODO: implement
        return new Promise((resolve, reject) => {
            resolve([]);
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
        // !mwd - TODO: implement
        return new Promise((resolve, reject) => {
            resolve([]);
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
        return new Promise((resolve, reject) => {
            const requests = visible_routes.map((r) => {
                const idx = r.id;
                const color = r.color;

                const url = `/feed/vehicle/byRoutes/${idx}?timeHorizon=30&timeSensitive=true`;
                return this.requestor2.get(url).then((response) => {
                    let vehicles = response.data.data.map((v) => {
                        const status = (deviation) => {
                            if (deviation < 0) {
                                return 'EARLY';
                            }
                            else if (deviation < 10) {
                                return 'ON TIME';
                            } else {
                                return 'LATE';
                            }
                        }
                        const deviation = v.scheduleAdherence || 0;

                        return new VehicleType({
                            id: v.vehicleId,
                            position: [v.latitude, v.longitude],
                            destination: v.tripDirection,
                            heading: v.heading,
                            on_board: v.currentPassengers,
                            deviation: Math.abs(deviation),
                            op_status: status(deviation),
                            route_id: idx,
                            color: color
                        });
                    });

                    return [idx, vehicles];
                });
            });

            Promise.all(requests).then((results) => {
                const vehicle_data = results.reduce((acc, result) => {
                    const [idx, vehicles] = result;
                    acc[idx] = vehicles;

                    return acc;
                }, {});

                resolve(vehicle_data);
            });
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
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    generatePolyline(data) {
        return data.data.map((r) => {
            return r.points.map((p) => {
                return [p.latitude, p.longitude];
            });
        });
    }
}

export default RouteShoutParser;
