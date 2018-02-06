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
import AgencyList from './AgencyList';

import './w3.css';
import './RouteContainer.css';

class RouteContainer extends Component {
    constructor() {
        super();

        let configuration = new Configuration();

        let agencies = configuration.agencies.map((a) => {
            return {name: a.name,
                    visible: true,
                    parser: a.parser,
                    routes: {}};
        });

        this.state = {
            agencies: agencies
        };


        this.getRoutes().then((results) => {
            // setup a timer to fetch the vehicles
            this.getVehicles();
            setInterval(() => {this.getVehicles();}, 10000);
        });
    }

    getRoutes() {
        return axios.all(this.state.agencies.map((a, index) => {
            return a.parser.getRoutes().then((routes) => {
                // the visibility is stored offline in local storage,
                //  restore it.
                const r = Object.keys(routes).reduce((acc, key) => {
                    let route = routes[key];

                    if (localStorage.getItem(key) === "false") {
                        route.visible = false;
                    }
                    acc[key] = route;

                    return acc;
                }, {});

                // update the agency without mutating the original
                const agencies = update(this.state.agencies, {[index]: {routes: {$set: r}}});

                this.setState({
                    agencies: agencies
                });

                return routes;
            });
        }));
    }

    getVehicles() {
        return axios.all(this.state.agencies.map((a, index) => {
            // if an Agency isn't visible, don't update it
            if (!a.visible) {
                return {};
            }

            return a.parser.getVehicles().then((vehicle_map) => {
                Object.keys(vehicle_map).map((route_id) => {
                    if (a.routes[route_id].visible) {
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
                    }
                    return [];
                });

                return {};
            });
        }));
    }

    toggleAgency(agency) {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});
        const agencies = update(this.state.agencies, {[i]: {visible: {$set: !agency.visible}}});

        this.setState({
            agencies: agencies
        });
    }

    toggleRoute(agency, route) {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});
        const agencies = update(this.state.agencies, {[i]: {routes: {[route.id]: {visible: {$set: !route.visible}}}}});
        this.setState({
            agencies: agencies
        });

        //!mwd - this is bad, it assumes routes have a globally unique id!
        localStorage.setItem(route.id, !route.visible);
    }

    render() {
        let routes_list = this.state.agencies.map((agency) => {
            if (!agency.visible) {
                return [];
            }
            return Object.keys(agency.routes).map((key) => {
                let route = agency.routes[key];

                if (!route.visible) {
                    return (null);
                }

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

        return ([
                <AgencyList key="agency-list" agencies={this.state.agencies} onAgencyClick={(agency) => this.toggleAgency(agency) } onRouteClick={(agency, route) => this.toggleRoute(agency, route) } />,
            <div key="main" className="w3-main RouteContainer-main">
                {/* Push content down on small screens */}
                <div className="w3-hide-large RouteContainer-header-margin">
                </div>

                <div className="w3-hide-medium w3-hide-small RouteContainer-header">
                    <h1 className="RouteContainer-h1">Birmingham Transit</h1>
                </div>

                <div className="w3-container">
                    <BaseMap>{routes}</BaseMap>
                </div>
            </div>
            ]
        );
    }
}

export default RouteContainer;
