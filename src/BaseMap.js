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

import React from 'react';
import { Map, TileLayer } from 'react-leaflet';
import Configuration from './Configuration';

class BaseMap extends React.Component {
    constructor() {
        super();

        // pulled from:
        //  https://leaflet-extras.github.io/leaflet-providers/preview/
        let tiles = {
            stamen_toner: {
                url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
                subdomains: 'abcd',
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            },
            black_and_white: {
                url: 'https://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
                subdomains: 'abcd',
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
        }

        let configuration = new Configuration();

        this.state = {
            center: configuration.center,
            zoom: 13,
            tile: tiles.stamen_toner
        };
    }

    render() {
        const position = this.state.center;

        return (
            <div className="map-container">
                <Map center={position} zoom={this.state.zoom} zoomControl={false}>
                    <TileLayer
                        attribution={this.state.tile.attribution}
                        url={this.state.tile.url}
                        subdomains={this.state.tile.subdomains}
                        />

                    {this.props.children}

                </Map>
            </div>
        );
    }
}

export default BaseMap;
