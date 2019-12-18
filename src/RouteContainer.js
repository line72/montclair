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
import FirstRunHint from './FirstRunHint';
import LocalStorage from './LocalStorage';

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

        this.storage = new LocalStorage();
        this.initialViewport = this.storage.state.viewport;
        this.bounds = this.storage.state.bounds;
        this.has_fetched_routes = false;

        this.state = {
            agencies: agencies
        };


        this.getRoutes().then((results) => {
            this.has_fetched_routes = true;
            // setup a timer to fetch the vehicles
            this.getVehicles();
            setInterval(() => {this.getVehicles();}, 10000);
        });
    }

    getRoutes() {
        return axios.all(this.state.agencies.map((a, index) => {
            a.visible = this.storage.isAgencyVisible(a);

            return a.parser.getRoutes().then((routes) => {
                // the visibility is stored offline in local storage,
                //  restore it.
                const r = Object.keys(routes).reduce((acc, key) => {
                    let route = routes[key];

                    route.visible = this.storage.isRouteVisible(a, route);
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
        if (!this.has_fetched_routes)
            return Promise.resolve({});

        return axios.all(this.state.agencies.map((a, index) => {
            // if an Agency isn't visible, don't update it
            if (!a.visible) {
                return {name: a.name,
                        routes: a.routes};
            }

            // get a list of visible routes
            const visible_routes = Object.keys(a.routes).map((k) => {
                return a.routes[k];
            }).filter(r => r.visible);

            // update our agency
            return a.parser.getVehicles(this.bounds, visible_routes).then((vehicle_map) => {
                let routes = Object.keys(vehicle_map).reduce((acc, route_id) => {
                    if (a.routes[route_id] && a.routes[route_id].visible) {
                        let vehicles = vehicle_map[route_id];
                        // sort vehicles based on id
                        vehicles.sort((a, b) => { return a.id <= b.id; });

                        // create a new map with the update
                        //  we like immutability.
                        const updated_routes = update(acc,
                                                      {[route_id]:
                                                       {vehicles:
                                                        {$set: vehicles}}});

                        return updated_routes;
                    } else {
                        // don't update the state
                        return acc;
                    }
                }, this.state.agencies[index].routes);

                return {name: a.name,
                        routes: routes};
            });
        })).then((results) => {
            let agencies = results.map((r) => {
                let i = this.state.agencies.findIndex((e) => {return e.name === r.name});

                return update(this.state.agencies, {[i]: {routes: {$set: r.routes}}})[i];
            });

            this.setState({
               agencies: agencies
            });
        });
    }

    toggleAgency(agency) {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});
        const agencies = update(this.state.agencies, {[i]: {visible: {$set: !agency.visible}}});

        this.setState({
            agencies: agencies
        });

        // !mwd - we pass agencies, not this.agencies
        //  since our state update hasn't happened yet!
        this.storage.updateVisibility(agencies);
    }

    toggleRoute(agency, route) {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});
        const agencies = update(this.state.agencies, {[i]: {routes: {[route.id]: {visible: {$set: !route.visible}}}}});
        this.setState({
            agencies: agencies
        });

        // !mwd - we pass agencies, not this.agencies
        //  since our state update hasn't happened yet!
        this.storage.updateVisibility(agencies);
    }

    onBoundsChanged = (bounds) => {
        this.bounds = bounds;

        // save the state
        this.storage.updateBounds(bounds);

        // reload the vehicles
        this.getVehicles();
    }

    onViewportChanged = (viewport) => {
        this.storage.updateViewport(viewport);
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

        let first_run = this.storage.isFirstRun();

        return ([
                <AgencyList key="agency-list" isFirstRun={first_run} agencies={this.state.agencies} onAgencyClick={(agency) => this.toggleAgency(agency) } onRouteClick={(agency, route) => this.toggleRoute(agency, route) } />,
            <div key="main" className="w3-main RouteContainer-main">
                {/* Push content down on small screens */}
                <div className="w3-hide-large RouteContainer-header-margin">
                </div>

                <div className="w3-hide-medium w3-hide-small RouteContainer-header">
                    <h1 className="RouteContainer-h1">Birmingham Transit</h1>
                </div>

                <div className="">
                    <FirstRunHint key="first-run-dialog" isFirstRun={first_run} />
                    <BaseMap
                        initialViewport={this.initialViewport}
                        onBoundsChanged={this.onBoundsChanged}
                        onViewportChanged={this.onViewportChanged}
                        >
                        {routes}
                    </BaseMap>
                </div>
            </div>
            ]
        );
    }
}

export default RouteContainer;
