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

class RouteContainer extends Component {
    constructor() {
        super();

        this.state = {
            routes: []
        }

        let configuration = new Configuration();
        let url = configuration.base_url + '/rest/Routes/GetVisibleRoutes';
        axios.get(url).then((response) => {
            let routes = response.data.map((route, index) => {
                console.log(`route=${route.RouteId} ${route.ShortName}`);
                return {id: route.RouteId,
                        name: route.ShortName,
                        color: route.Color,
                        path: configuration.base_url + '/Resources/Traces/' + route.RouteTraceFilename
                       }
            });

            // update the state
            this.setState({
                routes: routes
            });
        });
    }

    render() {
        const routes = this.state.routes.map((route) => {
            return (<Route id={route.id}
                    path={route.path}
                    name={route.name}
                    color={route.color} />);
        });

        return (<div>{routes}</div>);
    }
}

export default RouteContainer;
