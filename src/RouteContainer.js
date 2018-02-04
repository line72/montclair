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
            routes: [],
            vehicles: []
        }

        // set up a timer to fetch the routes and vehicles
        //  every 30 seconds
        this.fetchRoutes();
        setInterval(() => {this.fetchRoutes();}, 10000);
    }

    fetchRoutes() {
        console.log('fetch vehicles');
        let configuration = new Configuration();
        let url = configuration.base_url + '/rest/Routes/GetVisibleRoutes';
        axios.get(url).then((response) => {
            let routes = response.data.map((route, index) => {
                console.log(`route=${route.RouteId} ${route.ShortName}`);

                return {id: route.RouteId,
                        name: route.ShortName,
                        color: route.Color,
                        path: configuration.base_url + '/Resources/Traces/' + route.RouteTraceFilename,
                       };
            });
            let vehicles_list = response.data.map((route, index) => {
                let vehicles = route.Vehicles.map((vehicle, i) => {
                    return {id: vehicle.VehicleId,
                            position: [vehicle.Latitude, vehicle.Longitude],
                            direction: vehicle.DirectionLong,
                            on_board: vehicle.OnBoard,
                            deviation: vehicle.Deviation,
                            op_status: vehicle.OpStatus,
                            color: route.Color
                           };
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
        console.log('fetch vehicles');
        let configuration = new Configuration();
        let url = configuration.base_url + '/rest/Routes/GetVisibleRoutes';
        axios.get(url).then((response) => {
            let vehicles_list = response.data.map((route, index) => {
                let vehicles = route.Vehicles.map((vehicle, i) => {
                    return {id: vehicle.VehicleId,
                            position: [vehicle.Latitude, vehicle.Longitude],
                            direction: vehicle.DirectionLong,
                            on_board: vehicle.OnBoard,
                            deviation: vehicle.Deviation,
                            op_status: vehicle.OpStatus,
                            color: route.Color
                           };
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

    render() {
        const routes = this.state.routes.map((route) => {
            return (<Route key={route.id}
                    id={route.id}
                    path={route.path}
                    name={route.name}
                    color={route.color} />
                   );
        });
        const vehicles = this.state.vehicles.map((vehicle) => {
            return (<Bus key={vehicle.id}
                    id={vehicle.id}
                    position={vehicle.position}
                    color={vehicle.color} />);
        });


        return (<div>{routes}{vehicles}</div>);
       }
}

export default RouteContainer;
