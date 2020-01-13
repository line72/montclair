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
import StopType from './StopType';
import ArrivalType from './ArrivalType';

class RouteShout2Parser {
    constructor(url, agency_id, key) {
        this.url = url;
        this.agency_id = agency_id;
        this.key = key;

        this.requestor = axios.create({
            baseURL: this.url
        });
    }

    getRoutes() {
        const url = '/rs.routes.getList';

        return this.requestor.get(url, {params: {key: this.key, agency: this.agency_id}})
            .then((response) => {
                const promises = response.data.response.map((route) => {
                    // get the shape of the route
                    const url = '/rs.shape.getListByRoute';
                    return this.requestor.get(url, {params: {
                        key: this.key,
                        agency: this.agency_id,
                        route: route.id
                    }}).then((response2) => {
                        const polyline = this.generatePolyline(response2.data);

                        return new RouteType({
                            id: route.id,
                            number: route.sn,
                            name: route.ln,
                            color: route.c.slice(1), // strip the #
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
        const url = '/rs.stops.getList';
        return this.requestor.get(url, {params: {key: this.key,
                                                 agency: this.agency_id,
                                                 route: route.id}})
            .then((response) => {
                let stops = response.data.response.map((stop) => {
                    return new StopType({
                        id: stop.id,
                        name: stop.n,
                        position: [stop.la, stop.lo]
                    });
                });

                return stops;
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
        const url = '/rs.stops.getTimes';
        return this.requestor.get(url, {params: {key: this.key,
                                                 agency: this.agency_id,
                                                 stop: stopId}})
            .then((response) => {
                let arrivals = response.data.response.map((i) => {
                    return new ArrivalType({
                        route: routes[i.route],
                        direction: i.direction,
                        arrival: i.etaDepartTime
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

    getVehicles(bounds, visible_routes) {
        const requests = visible_routes.map((r) => {
            const url = '/rs.vehicle.getListByRoutes';
            return this.requestor.get(url, {params: {key: this.key,
                                                     agency: this.agency_id,
                                                     routes: r.id,
                                                     timeSensitive: true,
                                                     timeHorizon: 30}})
                .then((response) => {
                    let vehicles = response.data.response.map((v) => {
                        // const status = (deviation) => {
                        //     if (deviation < 0) {
                        //         return 'EARLY';
                        //     }
                        //     else if (deviation < 10) {
                        //         return 'ON TIME';
                        //     } else {
                        //         return 'LATE';
                        //     }
                        // };
                        // const deviation = v.s || 0;

                        //!mwd - I am not sure I got all these variables, correct
                        //  they are quite cryptic...
                        return new VehicleType({
                            id: v.vId,
                            position: [v.la, v.lo],
                            destination: v.d,
                            on_board: '',
                            heading: v.h,
                            route_id: r.id,
                            color: r.color
                        });
                    });

                    return [r.id, vehicles];
                });
        });

        return Promise.all(requests).then((results) => {
            const vehicle_data = results.reduce((acc, result) => {
                const [idx, vehicles] = result;
                acc[idx] = vehicles;

                return acc;
            }, {});

            return vehicle_data;
        });
    }

    generatePolyline(data) {
        return data.response.map((r) => {
            return r.p.map((p) => {
                return [p.la, p.lo];
            });
        });
    }
}

export default RouteShout2Parser;
