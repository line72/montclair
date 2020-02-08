/* -*- Mode: rjsx -*- */

/*******************************************
 * Copyright (2020)
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

import Route from './Route';
import BaseMap from './BaseMap';
import AgencyList from './AgencyList';
import FirstRunHint from './FirstRunHint';

class ExploreContainer extends Component {
    render() {
        let routes_list = this.props.agencies.map((agency) => {
            return Object.keys(agency.routes).map((key) => {
                let route = agency.routes[key];

                if (!route.visible) {
                    return (null);
                }

                return (
                    <Route key={route.id}
                           agency={agency}
                           route={route}
                           id={route.id}
                           number={route.number}
                           name={route.name}
                           selected={route.selected}
                           color={route.color}
                           vehicles={route.vehicles}
                           stops={route.stops}
                           onStopClicked={(props, stop) => this.props.onStopClicked(props, stop)}
                           />
                );
            });
        });
        // flatten
        let routes = Array.prototype.concat.apply([], routes_list);

        let first_run = this.props.isFirstRun;

        return ([
            <AgencyList key="agency-list" isFirstRun={first_run} agencies={this.props.agencies} onAgencyClick={(agency) => this.props.toggleAgency(agency) } onRouteClick={(agency, route) => this.props.toggleRoute(agency, route) } />,
            <div key="main" className="w3-main RouteContainer-main">
              {/* Push content down on small screens */}
              <div className="w3-hide-large RouteContainer-header-margin">
              </div>

              <div className="">
                <FirstRunHint key="first-run-dialog" isFirstRun={first_run} />
                <BaseMap
                  configuration={this.props.configuration}
                  initialViewport={this.props.initialViewport}
                  onBoundsChanged={this.props.onBoundsChanged}
                  onViewportChanged={this.props.onViewportChanged}
                >
                  {routes}
                </BaseMap>
              </div>
            </div>
        ]);
    }
}

export default ExploreContainer;
