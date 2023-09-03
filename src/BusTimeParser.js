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

        console.log(this.url);
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
     * @return Promise -> map(Id,RouteType) : Returns a map of RouteTypes by Id
     */
    getRoutes() {
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

                    return new RouteType({
                        id: route.rt,
                        number: route.rtdd,
                        name: route.rtnm,
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
            success({});
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
            success(null);
        });
    }

    generatePolyline(data) {
        return data.map((r) => {
            return r.pt.map((p) => {
                return [p.lat, p.lon];
            });
        });
    }
}

export default BusTimeParser;

