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
import { GeoJSON } from 'react-leaflet';
import toGeoJSON from '@mapbox/togeojson';

class Route extends Component {
    constructor(props) {
        super(props);

        this.state = {
            geojson: null
        };

        // fetch the kml
        axios.get(this.props.path).then((response) => {
            // parse the xml and convert to geojson
            let xml = new DOMParser().parseFromString(response.data, 'text/xml');
            let geojson = toGeoJSON.kml(xml);

            this.setState({
                geojson: geojson
            });
        });

    }

    render() {
        let style = () => {
            let w = this.props.selected ? 7 : 1;

            return {
                color: `#${this.props.color}`,
                weight: w
            };
        };

        if (this.state.geojson != null) {
            return (<GeoJSON
                    data={this.state.geojson}
                    style={style}
                    />);
        } else {
            return (<div />);
        }
    }
}

export default Route;
