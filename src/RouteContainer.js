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
import update from 'immutability-helper';
import axios from 'axios';
import Configuration from './Configuration';
import Route from './Route';
import BaseMap from './BaseMap';

class RouteContainer extends Component {
    constructor() {
        super();

        let configuration = new Configuration();

        let agencies = configuration.agencies.map((a) => {
            return {name: a.name,
                    parser: a.parser,
                    routes: {}};
        });

        this.state = {
            agencies: agencies
        };


        this.getRoutes().then((x) => {
            // setup a timer to fetch the vehicles
            this.getVehicles();
            setInterval(() => {this.getVehicles();}, 10000);
        });
    }

    getRoutes() {
        return axios.all(this.state.agencies.map((a, index) => {
            return a.parser.getRoutes().then((routes) => {
                // update the agency without mutating the original
                const agencies = update(this.state.agencies, {[index]: {routes: {$set: routes}}});

                this.setState({
                    agencies: agencies
                });

                return routes;
            });
        }));
    }

    getVehicles() {
        return axios.all(this.state.agencies.map((a, index) => {
            return a.parser.getVehicles().then((vehicle_map) => {
                Object.keys(vehicle_map).map((route_id) => {
                    let vehicles = vehicle_map[route_id];

                    const agencies = update(this.state.agencies,
                                            {[index]:
                                             {routes:
                                              {[route_id]:
                                               {vehicles:
                                                {$set: vehicles}}}}});

                    this.setState({
                        agencies: agencies
                    });

                    return vehicles;
                });

                return {};
            });
        }));
    }
    render() {
        let routes_list = this.state.agencies.map((agency) => {
            return Object.keys(agency.routes).map((key) => {
                let route = agency.routes[key];

                return (
                    <Route key={route.id}
                           route={route}
                           id={route.id}
                           number={route.number}
                           name={route.name}
                           selected={route.selected}
                           color={route.color}
                           vehicles={route.vehicles}
                           />
                );
            });
        });
        // flatten
        let routes = Array.prototype.concat.apply([], routes_list);

        return (<div><BaseMap>{routes}</BaseMap></div>);
    }
}

export default RouteContainer;
