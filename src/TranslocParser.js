/* -*- Mode: rjsx -*- */

/*******************************************
 * Copyright (2018)
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
import polyUtil from 'polyline-encoded';

import RouteType from './RouteType';
import VehicleType from './VehicleType';
import StopType from './StopType';
import ArrivalType from './ArrivalType';

class TranslocParser {
    constructor(key, agency_id, url) {
        this.url = url || 'https://transloc-api-1-2.p.mashape.com/';
        this.key = key;
        this.agency_id = agency_id;

        this.requestor = axios.create({
            baseURL: this.url,
            headers: {'X-Mashape-Key': this.key}
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
     * @return Promise -> map(Id,RouteType) : Returns a map of RouteTypes by Id
     */
    getRoutes() {
        // first get the segments so we can build our route paths
        let url = `/segments.json?agencies=${this.agency_id}`;
        return this.requestor.get(url).then((response) => {
            let segments = response.data.data;

            let url = `/routes.json?agencies=${this.agency_id}`;

            return this.requestor.get(url).then((response) => {
                let route_data = response.data.data[this.agency_id]

                // parse it
                let routes = route_data.reduce((acc, route) => {
                    // build out the segments
                    let polyline = route.segments.map((segment) => {
                        let lat_lng = polyUtil.decode(segments[segment[0]]);
                        if (segment[1] === "backward") {
                            return lat_lng.reverse();
                        } else {
                            return lat_lng;
                        }
                    });

                    acc[route.route_id] = new RouteType({
                        id: route.route_id,
                        number: route.short_name,
                        name: route.long_name,
                        color: route.color,
                        polyline: polyline
                    });

                    return acc;
                }, {});

                return routes;
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
        const url = '/stops.json';
        return this.requestor.get(url, {params: {agencies: this.agency_id}}).then((response) => {
            // Step 1: Filter stops to only this route
            // Step 2: Convert to StopType
            return response.data.data.filter((stop) => {
                return stop.routes.includes(route.id);
            }).map((stop) => {
                return new StopType({
                    id: stop.stop_id,
                    name: stop.name,
                    position: [stop.location.lat, stop.location.lng]
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
        const url = '/arrival-estimates.json'
        return this.requestor.get(url, {params: {agencies: this.agency_id, stops: stopId}})
            .then((response) => {
                // !mwd - there should ONLY be one item in the list
                //  because we have only requested a single stopId.
                // We could potentially do some filtering, but maybe later...
                const arrivals = response.data.data.flatMap((stop) => {
                    return stop.arrivals.map((arrival) => {
                        return new ArrivalType({
                            route: routes[arrival.route_id],
                            direction: '',
                            arrival: arrival.arrival_at,
                            vehicleId: arrival.vehicle_id,
                            tripId: `${arrival.route_id}_${arrival.vehicle_id}`
                        });
                    });
                });

                // sort based on arrival time
                return arrivals.sort((a, b) => {
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
        let url = `/vehicles.json?agencies=${this.agency_id}`;

        if (bounds != null) {
            // filter vehicles not within the bounds
            // !mwd - we expand the search region a little bit
            //  so that vehicles don't jump in and out of the screen
            let epsilon = 0.008;
            let bottomLeft = [bounds["_southWest"]["lat"] - epsilon, bounds["_southWest"]["lng"] - epsilon];
            let topRight = [bounds["_northEast"]["lat"] + epsilon, bounds["_northEast"]["lng"] + epsilon];

            url=`${url}&geo_area=${bottomLeft[0]},${bottomLeft[1]}|${topRight[0]},${topRight[1]}`;
        }

        return this.requestor.get(url).then((response) => {
            let vehicle_data = response.data.data[this.agency_id] || []

            return vehicle_data.reduce((acc, vehicle) => {
                let v = new VehicleType({
                    id: vehicle.vehicle_id,
                    position: [vehicle.location.lat, vehicle.location.lng],
                    heading: vehicle.heading,
                    destination: '',
                    on_board: vehicle.passenger_load || '',
                    route_id: vehicle.route_id
                });

                if (v.route_id in acc) {
                    acc[v.route_id].push(v);
                } else {
                    acc[v.route_id] = [v];
                }

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
        let url = '/vehicles.json';

        return this.requestor.get(url, {params: {agencies: this.agency_id,
                                                 routes: route.id}})
            .then((result) => {
                let vehicle_data = result.data.data[this.agency_id] || [];

                return vehicle_data.find((e) => {
                    return e.vehicle_id === vehicleId;
                });
            }).then((result) => {
                if (result) {
                    return new VehicleType({
                        id: result.vehicle_id,
                        position: [result.location.lat, result.location.lng],
                        heading: result.heading,
                        destination: '',
                        on_board: result.passenger_load || '',
                        route_id: result.route_id
                    });
                } else {
                    return result;
                }
            });
    }
}


export default TranslocParser;
