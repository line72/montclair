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

import RouteType from './RouteType';
import VehicleType from './VehicleType';
import StopType from './StopType';
import ArrivalType from './ArrivalType';

class BusTimeParser {
    constructor(url, key) {
        this.url = url;
        this.key = key;

        this.requestor = axios.create({
            baseURL: this.url + '/bustime/api/v3'
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
        const url = '/getroutes';
        const params = {
            key: this.key,
            format: 'json'
        };
        return this.requestor.get(url, {params: params}).then((response) => {
            const promises = response.data['bustime-response']['routes'].map((route) => {
                const url = '/getpatterns';
                const params = {
                    key: this.key,
                    format: 'json',
                    rt: route.rt
                };
                return this.requestor.get(url, {params: params}).then((response2) => {
                    const polyline = this.generatePolyline(response2.data['bustime-response']['ptr']);

                    let parseName = (n) => {
                        if (options && options.parseNameFn) {
                            return options.parseNameFn(n);
                        }
                        return n;
                    };
                    
                    return new RouteType({
                        id: route.rt,
                        number: route.rtdd,
                        name: parseName(route.rtnm),
                        color: route.rtclr.slice(1), // strip the #
                        polyline: polyline
                    });
                });
            });

            return axios.all(promises).then((results) => {
                // convert into a map
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
        // Get all the directions of a route (usually inbound and outbound)
        //  Then for each direction, get the list of stops
        const url = '/getdirections';
        const params = {
            key: this.key,
            format: 'json',
            rt: route.id
        };
        return this.requestor.get(url, {params: params}).then((response) => {
            const promises = response.data['bustime-response']['directions'].map((direction) => {
                const url = '/getstops';
                const params = {
                    key: this.key,
                    format: 'json',
                    rt: route.id,
                    dir: direction.id
                };

                return this.requestor.get(url, {params: params}).then((response2) => {
                    return response2.data['bustime-response']['stops'].map((stop) => {
                        return new StopType({
                            id: stop.stpid,
                            name: stop.stpnm,
                            position: [stop.lat, stop.lon]
                        });
                    });
                });
            });

            return axios.all(promises).then((results) => {
                // flatten the map
                return results.flatMap((stops) => {
                    return stops;
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
        const url = '/getpredictions';
        const params = {
            key: this.key,
            format: 'json',
            stpid: stopId,
            top: 10,
            tmres: 's'
        };

        return this.requestor.get(url, {params: params}).then((response) => {
            let arrivals = response.data['bustime-response']['prd'].map((i) => {
                return new ArrivalType({
                    route: routes[i.rt],
                    direction: i.rtdir,
                    arrival: this.fixDateTime(i.prdtm),
                    vehicleId: i.vid,
                    tripId: i.tatripid
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
        if (visible_routes.length === 0) {
            return new Promise((success, failure) => {
                success({});
            });
        }

        const url = '/getvehicles';
        const params = {
            key: this.key,
            format: 'json',
            rt: visible_routes.map(r => r.id).join(','),
            tmres: 's'
        };
        return this.requestor.get(url, {params: params}).then((response) => {
            if (response.data['bustime-response']['error']) {
                return {};
            }
            
            return response.data['bustime-response']['vehicle'].reduce((acc, vehicle) => {
                if (!Object.hasOwn(acc, vehicle.rt)) {
                    acc[vehicle.rt] = [];
                }
                acc[vehicle.rt].push(new VehicleType({
                    id: vehicle.vid,
                    position: [vehicle.lat, vehicle.lon],
                    desitination: vehicle.des,
                    on_board: vehicle.psgld,
                    heading: parseInt(vehicle.hdg, 10),
                    route_id: vehicle.rt,
                    color: this.findRoute(visible_routes, vehicle.rt).color
                }));

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
        if (!vehicleId) {
            return new Promise((success, failure) => {
                success(null);
            });
        }
        
        const url = '/getvehicles';
        const params = {
            key: this.key,
            format: 'json',
            vid: vehicleId,
            tmres: 's'
        };
        return this.requestor.get(url, {params: params}).then((response) => {
            if (response.data['bustime-response']['error']) {
                return null;
            }

            let vehicles = response.data['bustime-response']['vehicle'].map((vehicle) => {
                return new VehicleType({
                    id: vehicle.vid,
                    position: [parseFloat(vehicle.lat), parseFloat(vehicle.lon)],
                    desitination: vehicle.des,
                    on_board: vehicle.psgld,
                    heading: parseInt(vehicle.hdg, 10),
                    route_id: vehicle.rt,
                    color: route.color
                });
            });

            return this.firstItem(vehicles, null);
        });
    }

    generatePolyline(data) {
        return data.map((r) => {
            return r.pt.map((p) => {
                return [p.lat, p.lon];
            });
        });
    }

    fixDateTime(t) {
        // Format is currently 20230903 18:30:00
        // which moment won't parse
        // change to
        // 20230903T18:30:00
        return t.replace(' ', 'T').replaceAll(':', '');
    }

    findRoute(routes, r_id) {
        return routes.find((e) => e.id === r_id);
    }

    firstItem(arr, default_v) {
        if (arr && arr.length > 0) {
            return arr[0];
        }

        return default_v;
    }
}

export default BusTimeParser;

