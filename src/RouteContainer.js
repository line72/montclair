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
import StopOverlayType from './StopOverlayType';
import LocalStorage from './LocalStorage';
import StopEstimatesContainer from './StopEstimatesContainer';
import ExploreContainer from './ExploreContainer';

import './w3.css';
import './RouteContainer.css';

const MODE = Object.freeze({"EXPLORE": 1, "STOP": 2});

class RouteContainer extends Component {
    constructor() {
        super();

        this.configuration = new Configuration();

        let agencies = this.configuration.agencies.map((a) => {
            return {name: a.name,
                    visible: true,
                    parser: a.parser,
                    hideRouteNumber: !!a.hideRouteNumber,
                    routes: {}};
        });

        this.storage = new LocalStorage();
        this.initialViewport = this.storage.state.viewport;
        this.currentViewport = this.initialViewport;
        this.bounds = this.storage.state.bounds;
        this.has_fetched_routes = false;

        this.state = {
            mode: MODE.EXPLORE,
            agencies: agencies,
            stopOverlay: new StopOverlayType({})
        };


        this.getRoutes().then((results) => {
            this.has_fetched_routes = true;

            // get the stops for any visible routes
            this.getStops();

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

    getStops() {
        if (!this.has_fetched_routes) {
            return;
        }

        axios.all(this.state.agencies.flatMap((a, index) => {
            // get a list of visible routes
            const visible_routes = Object.keys(a.routes).map((k) => {
                return a.routes[k];
            }).filter(r => r.visible);

            return visible_routes.map((r) => {
                return a.parser.getStopsFor(r).then((stops) => {
                    return {
                        agency_id: a.name,
                        route_id: r.id,
                        stops: stops
                    };
                });
            });
        })).then((results) => {
            // results are a list of:
            // {
            //    agency_id: abc,
            //    route_id: xyz,
            //    stops: [StopType]
            // }
            // or null

            this.setState((state) => {
                const updatedAgencies = results.reduce((acc, result) => {
                    if (result === null) {
                        return acc;
                    }
                    let i = state.agencies.findIndex((e) => {return e.name === result.agency_id});
                    return update(acc,
                                  {[i]:
                                   {routes:
                                    {[result.route_id]:
                                     {stops: {$set: result.stops}}}}});
                }, state.agencies);

                return {
                    agencies: updatedAgencies
                };
            });
        });
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

    toggleAgency = (agency) => {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});
        const agencies = update(this.state.agencies, {[i]: {visible: {$set: !agency.visible}}});

        this.setState({
            agencies: agencies
        });

        // !mwd - we pass agencies, not this.agencies
        //  since our state update hasn't happened yet!
        this.storage.updateVisibility(agencies);
    }

    toggleRoute = (agency, route) => {
        let i = this.state.agencies.findIndex((e) => {return e.name === agency.name});

        const visible = !route.visible;

        const agencies = update(this.state.agencies, {[i]: {routes: {[route.id]: {visible: {$set: visible}}}}});
        this.setState((state) => {
            return {
                agencies: agencies
            };
        });

        // async pull down the stops if visible
        if (visible && route.stops.length === 0) {
            agency.parser.getStopsFor(route).then((stops) => {
                this.setState((state) => {
                    const agencies = update(state.agencies, {[i]: {routes: {[route.id]: {stops: {$set: stops}}}}});
                    return {
                        agencies: agencies
                    };
                });
            });
        }


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
        this.currentViewport = viewport;
        this.storage.updateViewport(viewport);
    }

    onStopClicked = ({agency, id, name}, stop) => {
        // update the viewport
        this.initialViewport = this.currentViewport;

        this.setState({
            mode: MODE.STOP,
            stopOverlay: new StopOverlayType({
                agency: agency,
                stop: stop,
                id: id,
                name: name,
                fetching: true,
                visible: true
            })
        });
    }

    onStopOverlayClosed = () => {
        // kill the overlay state
        this.setState((state) => {
            return {
                mode: MODE.EXPLORE,
                stopOverlay: new StopOverlayType({})
            };
        });
    }

    render() {
        if (this.state.mode === MODE.STOP) {
            return (
                <StopEstimatesContainer
                  configuration={this.configuration}
                  stopOverlay={this.state.stopOverlay}
                  onClose={this.onStopOverlayClosed}
                  initialViewport={this.initialViewport}
                />
            );
        } else {
            return (
                <ExploreContainer
                  configuration={this.configuration}
                  agencies={this.state.agencies}
                  isFirstRun={this.storage.isFirstRun()}
                  onStopClicked={this.onStopClicked}
                  togggleAgency={this.toggleAgency}
                  toggleRoute={this.toggleRoute}
                  initialViewport={this.initialViewport}
                  onBoundsChanged={this.onBoundsChanged}
                  onViewportChanged={this.onViewportChanged}
                />
            );
        }
    }
}

export default RouteContainer;
