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

import React, { Component } from 'react';
import axios from 'axios';
import Configuration from './Configuration';
import Route from './Route';
import Bus from './Bus';

class RouteContainer extends Component {
    constructor() {
        super();

        this.state = {
            routes: {},
            vehicles: []
        }

        // set up a timer to fetch the routes and vehicles
        //  every 10 seconds
        this.fetchRoutes();
        setInterval(() => {this.fetchVehicles();}, 10000);
    }

    fetchRoutes() {
        let configuration = new Configuration();
        let url = configuration.base_url + '/rest/Routes/GetVisibleRoutes';
        axios.get(url).then((response) => {
            let routes = response.data.reduce((acc, route) => {
                acc[route.RouteId] =  {
                    id: route.RouteId,
                    name: route.ShortName,
                    color: route.Color,
                    selected: false,
                    path: configuration.base_url + '/Resources/Traces/' + route.RouteTraceFilename,
                };

                return acc;
            }, {});
            let vehicles_list = response.data.map((route, index) => {
                let vehicles = route.Vehicles.map((vehicle, i) => {
                    return this.parseVehicle(route, vehicle);
                });
                return vehicles;
            });
            // flatten the map
            let vehicles = Array.prototype.concat.apply([], vehicles_list)

            // update the state
            this.setState({
                routes: routes,
                vehicles: vehicles
            });
        });
    }
    fetchVehicles() {
        let configuration = new Configuration();
        let url = configuration.base_url + '/rest/Routes/GetVisibleRoutes';
        axios.get(url).then((response) => {
            let vehicles_list = response.data.map((route, index) => {
                let vehicles = route.Vehicles.map((vehicle, i) => {
                    return this.parseVehicle(route, vehicle);
                });
                return vehicles;
            });
            // flatten the map
            let vehicles = Array.prototype.concat.apply([], vehicles_list)

            // update the state
            this.setState({
                vehicles: vehicles
            });
        });
    }

    parseVehicle(route, vehicle) {
        return {id: vehicle.VehicleId,
                position: [vehicle.Latitude, vehicle.Longitude],
                direction: vehicle.DirectionLong,
                heading: vehicle.Heading,
                on_board: vehicle.OnBoard,
                deviation: vehicle.Deviation,
                op_status: vehicle.OpStatus,
                color: route.Color,
                route_id: route.RouteId
               };
    }

    generateDashes(index) {
        // let variants = [
        //     "1, 15, 1, 15",
        //     "15, 1, 15, 1",
        //     "1, 25, 1, 25",
        //     "25, 1, 25, 1",
        //     "1, 10, 20, 30, 20, 10, 1",
        // ];
        let variants = [
            "25, 45"
        ];

        return variants[index % variants.length];
    }

    render() {
        let routes = Object.keys(this.state.routes).map((key) => {
            let route = this.state.routes[key];
            return (<Route key={route.id}
                    id={route.id}
                    path={route.path}
                    name={route.name}
                    selected={route.selected}
                    color={route.color} />
                   );
        });
        let vehicles = this.state.vehicles.map((vehicle) => {
            let onOpen = () => {
                let routes = this.state.routes;

                let route = routes[vehicle.route_id];
                route.selected = true;

                routes[vehicle.route_id] = route;
                this.setState({routes: routes});
            }
            let onClose = () => {
                let routes = this.state.routes;

                let route = routes[vehicle.route_id];
                route.selected = false;

                routes[vehicle.route_id] = route;
                this.setState({routes: routes});
            }

            return (<Bus key={vehicle.id}
                    id={vehicle.id}
                    position={vehicle.position}
                    heading={vehicle.heading}
                    route_id={vehicle.route_id}
                    route_name={this.state.routes[vehicle.route_id].name}
                    on_board={vehicle.on_board}
                    status={vehicle.op_status}
                    deviation={vehicle.deviation}
                    color={vehicle.color}
                    onOpen={onOpen}
                    onClose={onClose}
                    />);
        });


        return (<div>{routes}{vehicles}</div>);
       }
}

export default RouteContainer;
