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

class TransitappParser {
    constructor(url, apikey, networkId) {
        this.url = url
        this.apikey = apikey;
        this.networkId = networkId;

        this.requestor = axios.create({
            baseURL: this.url + '/v3/public',
            headers: {apiKey: this.apikey}
        });
        
        const retryFn = (err) => {
            // check if we have exceeded the rate limit (429(
            if (err.response && err.response.status === 429) {
                const {config, headers} = err.response;
                const timeout = (parseInt(headers['retry-after']) || 10) * 1000;

                const p = new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(true)
                    }, timeout);
                });
                return p.then(() => {
                    const url = config.url;
                    const params = config.params;
                    return this.requestor.get(url, {params: params});
                });
            }

            return Promise.reject(err);
        };

        this.requestor.interceptors.response.use((response) => {
            return response;
        }, retryFn);
    }

    /**
     * Initialze the parser.
     *
     * This should be called Before calling any other method.
     *
     * @return Promise -> true
     */
    initialize() {
        return Promise.resolve(true);
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
        const url = '/routes_for_network';
        const params = {
            network_id: this.networkId
        };

        return this.requestor.get(url, {params: params}).then((response) => {
            const promises = response.data['routes'].map((r) => {
                // const url = '/route_details';
                // const params = {
                //     global_route_id: r.global_route_id
                // }

                // return this.requestor.get(url, {params: params}).then((response2) => {
                //     const polylines = response2.data.itineraries.map((i) => {
                //         return i.shape;
                //     });

                //     // since we already have stops, include them here!
                //     const stops = response2.itineraries.flatMap((i) => {
                //         return i.stops.map((s) => {
                //             return new StopType({
                //                 id: s.global_stop_id,
                //                 name: s.stop_name,
                //                 position: [s.stop_lat, s.stop_lon]
                //             });
                //         });
                //     });
                    
                //     const route = new RouteType({
                //         id: r.global_route_id,
                //         number: r.route_short_name,
                //         name: r.route_long_name,
                //         color: r.route_color,
                //         polyline: polylines
                //     });
                //     route.stops = stops;

                //     return route;
                // });

                // We'll get the polylines later
                return Promise.resolve(new RouteType({
                    id: r.global_route_id,
                    number: r.route_short_name,
                    name: r.route_long_name,
                    color: r.route_color,
                    polylineDeferred: () => {
                        const url = '/route_details';
                        const params = {
                            global_route_id: r.global_route_id
                        };

                        return this.requestor.get(url, {params: params})
                            .then((response2) => {
                                const polylines = response2.data.itineraries.map((i) => {
                                    return polyUtil.decode(i.shape);
                                });
                                
                                return polylines;
                            });
                    }
                }));
            });
            
            return axios.all(promises).then((results) => {
                // convert to a map
                return results.reduce((acc, route) => {
                    acc[route.id] = route;
                    return acc;
                }, {});
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
        return Promise.resolve(route.stops);
    }

    /**
     * Get the arrivals for a stop
     *
     * @param stopId -> String : The id of the stop
     * @param routes -> map(RouteType) : The dictionary of routes
     * @return Promise -> [ArrivalType] : in sorted order
     */
    getArrivalsFor(stopId, routes) {
        return Promise.resolve([]);
    }

    /**
     * Get the vehicles for an area or a list of routes
     *
     * @param bounds -> ([LatLng]) : The leaflef bounds of the map
     * @param visible_routes -> ([RouteType]) : The list of routes
     * @return Promise -> map(RouteId,VehicleType) : Returns a map of VehicleType by RouteId
     */
    getVehicles(bounds, visible_routes) {
        return Promise.resolve({});
    }

    /**
     * Get a specific vehicle on a specific route
     *
     * @param route -> RouteType : The route
     * @param vehicleId -> String : The id of the vehicle, this matches the Trip's BlockFareboxId
     * @return Promise -> VehicleType | nil : The vehicle if found
     */
    getVehicle(route, vehicleId) {
        return Promise.resolve(null);
    }
}

export default TransitappParser;
