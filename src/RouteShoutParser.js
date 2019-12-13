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
    constructor(key, agency_id, routematch_url) {
        this.url = 'http://api.routeshout.com/v1/';
        this.key = key;
        this.agency_id = agency_id;
        this.routematch_url = routematch_url;

        // Hard-coded Route List
        this.routes = [
            [1, 'Blue Line', '2F54E8'],
            [2, 'Green Line', '53EB05'],
            [3, 'Night Condos', 'FC75E5'],
            [4, 'Night Line Winter 2018-19', 'F00089'],
            [5, 'Orange Line', 'ED7D31'],
            [6, 'Purple Line', '8000F6'],
            [7, 'Red Line', 'FF0000'],
            [8, 'Regional', 'C55A00'],
            [9, 'Yellow CMC', 'FFFF00'],
            [10, 'Yellow Hilltop', 'FFFF00'],
            [11, 'Yellow On-Call 2019', 'FEE543']
        ];

        this.requestor2 = axios.create({
            baseURL: this.routematch_url
        });
    }

    getRoutes() {
        // !mwd - TODO, will need to use routeshout api to
        //  get this list
        return new Promise((resolve, reject) => {
            const requests = this.routes.map((r) => {
                const [idx, name, color] = r;
                const url = `/feed/landRoute/byRoute/${name}`;
                return this.requestor2.get(url).then((response) => {
                    // generate a list of lat/long as a polyine
                    const polyline = this.generatePolyline(response.data);

                    return new RouteType({
                        id: idx,
                        number: idx,
                        name: name,
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

    getVehicles(bounds) {
        return new Promise((resolve, reject) => {
            const requests = this.routes.map((r) => {
                const [idx, name, color] = r;
                const url = `/feed/vehicle/byRoutes/${name}?timeHorizon=30&timeSensitive=true`;
                return this.requestor2.get(url).then((response) => {
                    console.log('vehicle response', response);
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

    generatePolyline(data) {
        return data.data.map((r) => {
            return r.points.map((p) => {
                return [p.latitude, p.longitude];
            });
        });
    }
}

export default RouteShoutParser;
