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
import moment from 'moment';

import RouteType from './RouteType';
import VehicleType from './VehicleType';
import StopType from './StopType';
import ArrivalType from './ArrivalType';

class Transloc3Parser {
    constructor(agency_id, url) {
        this.url = url || 'https://feed.transloc.com/3/';
        this.agency_id = agency_id;

        this.requestor = axios.create({
            baseURL: this.url,
        });
    }

    getRoutes() {
        // first get the segments so we can build our route paths
        let url = '/segments.json';
        return this.requestor.get(url, {params: {agencies: this.agency_id}}).then((response) => {
            let segments = response.data;

            let url = '/routes.json';

            return this.requestor.get(url, {params: {agencies: this.agency_id}}).then((response) => {
                let route_data = response.data.routes;

                // parse it
                let routes = route_data.reduce((acc, route) => {
                    // build out the segments
                    const route_segment = segments.routes.find(s => s.id === route.id);

                    let polyline = route_segment.segments.map((segment) => {
                        const s = segments.segments.find(s => s.id === Math.abs(segment));
                        let lat_lng = polyUtil.decode(s.points);

                        // !mwd - if segment is negative, then it is reversed
                        if (segment < 0) {
                            return lat_lng.reverse();
                        } else {
                            return lat_lng;
                        }
                    });

                    acc[route.id] = new RouteType({
                        id: route.id,
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
        return this.requestor.get(url, {params: {agencies: this.agency_id,
                                                 include_routes: true}})
            .then((response) => {
                // Step 1: Turn the Stops into a map based on id for quick cache lookup
                // Step 2: Filter stops to only this route
                // Step 3: Convert to StopType

                const stop_map = response.data.stops.reduce((acc, stop) => {
                    acc[stop.id] = stop;
                    return acc;
                }, {});

                return response.data.routes.filter((r) => {
                    return r.id === route.id;
                }).flatMap((r) => {
                    return r.stops.map((stop_id) => {
                        const stop = stop_map[stop_id];

                        return new StopType({
                            id: stop.id,
                            name: stop.name,
                            position: [stop.position[0], stop.position[1]]
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
        const url = '/vehicle_statuses.json'
        return this.requestor.get(url, {params: {agencies: this.agency_id,
                                                 include_arrivals: true,
                                                 schedules: true,
                                                 arrival_stop: stopId}})
            .then((response) => {
                // !mwd - there should ONLY be one item in the list
                //  because we have only requested a single stopId.
                // We could potentially do some filtering, but maybe later...
                const arrivals = response.data.arrivals.map((arrival) => {
                    return new ArrivalType({
                        route: routes[arrival.route_id],
                        direction: arrival.headsign,
                        arrival: moment.unix(arrival.timestamp)
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
        let url = '/vehicle_statuses.json';
        return this.requestor.get(url, {params: {agencies: this.agency_id,
                                                 include_arrivals: false}})
            .then((response) => {
                const vehicle_data = response.data.vehicles;

                // filter based on the visible routes
                const visible_route_ids = visible_routes.map(x => x.id);

                return vehicle_data.reduce((acc, vehicle) => {
                    // skip no visible routes
                    if (!visible_route_ids.includes(vehicle.route_id)) {
                        return acc;
                    }

                    let v = new VehicleType({
                        id: vehicle.id,
                        position: [vehicle.position[0], vehicle.position[1]],
                        heading: vehicle.heading,
                        destination: '',
                        on_board: '',
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
}

export default Transloc3Parser;
