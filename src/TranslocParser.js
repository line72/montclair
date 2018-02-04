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

class TranslocParser {
    constructor(key, agency_id) {
        this.url = 'https://transloc-api-1-2.p.mashape.com/';
        this.key = key;
        this.agency_id = agency_id;

        this.requestor = axios.create({
            baseURL: this.url,
            headers: {'X-Mashape-Key': this.key}
        });
    }

    getRoutes() {
        let url = `/routes.json?agencies=${this.agency_id}`;

        return this.requestor.get(url).then((response) => {
            let route_data = response.data.data[this.agency_id]

            // parse it
            let routes = route_data.reduce((acc, route) => {
                acc[route.route_id] = new RouteType({
                    id: route.route_id,
                    name: route.long_name,
                    color: route.color
                });

                return acc;
            }, {});

            return routes;
        });
    }

    getVehicles() {
        let url = `/vehicles.json?agencies=${this.agency_id}`;

        return this.requestor.get(url).then((response) => {
            let vehicle_data = response.data.data[this.agency_id]

            return vehicle_data.reduce((acc, vehicle) => {
                let v = new VehicleType({
                    id: vehicle.vehicle_id,
                    position: [vehicle.location.lat, vehicle.location.lng],
                    heading: vehicle.heading,
                    destination: '',
                    on_board: vehicle.passenger_load,
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

export default TranslocParser;
