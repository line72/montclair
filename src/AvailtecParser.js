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

class AvailtecParser {
    constructor(url) {
        this.url = url
    }

    getRoutes() {
        let url = this.url + '/rest/Routes/GetVisibleRoutes';

        return axios.get(url).then((response) => {
            let routes = response.data.reduce((acc, route) => {
                acc[route.RouteId] = new RouteType({
                    id: route.RouteId,
                    number: route.RouteId,
                    name: route.LongName,
                    color: route.Color,
                    kml: this.url + '/Resources/Traces/' + route.RouteTraceFilename
                });

                return acc;
            }, {});

            return routes;
        });
    }

    /**
     * Get the stops for a specific route.
     *
     * @param route -> (RouteType) : The route to get the stops for
     * @return Promise -> [StopType] : Returns a list of StopTypes
     */
    getStopsFor(route) {
        let url = this.url + `/rest/RouteDetails/Get/${route.id}`;

        return axios.get(url).then((response) => {
            let stops = response.data.Stops.map((stop) => {
                return new StopType({
                    id: stop.StopId,
                    name: stop.Name,
                    position: [stop.Latitude, stop.Longitude]
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
        let url = this.url + `/rest/StopDepartures/Get/${stopId}`;

        return axios.get(url).then((response) => {
            let arrivals = response.data.flatMap((i) => {
                return i.RouteDirections.flatMap((rd) => {
                    return rd.Departures.map((d) => {
                        return new ArrivalType({
                            route: routes[rd.RouteId],
                            direction: rd.Direction,
                            arrival: d.EDT || d.ETA
                        });
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

    getVehicles(bounds, visible_routes) {
        let url = this.url + '/rest/Routes/GetVisibleRoutes';

        return axios.get(url).then((response) => {
            let vehicles = response.data.reduce((acc, route) => {
                let vehicles = route.Vehicles.map((vehicle, i) => {
                    return this.parseVehicle(route, vehicle);
                }).filter((v) => {
                    // filter vehicles not within the bounds
                    // !mwd - we expand the search region a little bit
                    //  so that vehicles don't jump in and out of the screen
                    let epsilon = 0.008;
                    let bottomLeft = [bounds["_southWest"]["lat"] - epsilon, bounds["_southWest"]["lng"] - epsilon];
                    let topRight = [bounds["_northEast"]["lat"] + epsilon, bounds["_northEast"]["lng"] + epsilon];

                    if (v.position[0] >= bottomLeft[0] && v.position[0] <= topRight[0] &&
                        v.position[1] >= bottomLeft[1] && v.position[1] <= topRight[1]) {
                        return true;
                    } else {
                        return false;
                    }
                });
                acc[route.RouteId] = vehicles;

                return acc;
            }, {});

            return vehicles;
        });
    }
    parseVehicle(route, vehicle) {
        return new VehicleType({
            id: vehicle.VehicleId,
            position: [vehicle.Latitude, vehicle.Longitude],
            direction: vehicle.DirectionLong,
            heading: vehicle.Heading,
            destination: vehicle.Destination,
            on_board: vehicle.OnBoard,
            deviation: vehicle.Deviation,
            op_status: vehicle.OpStatus,
            color: route.Color,
            route_id: route.RouteId,
        });
    }
}

export default AvailtecParser;
