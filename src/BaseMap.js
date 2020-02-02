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

import React, { createRef } from 'react';
import { TileLayer } from 'react-leaflet';
import BoundsMap from './BoundsMap';

class BaseMap extends React.Component {
    constructor(props) {
        super(props);

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

        let configuration = this.props.configuration;
        this.mapRef = createRef();

        this.state = {
            initial_viewport: true,
            center: configuration.center,
            zoom: 13,
            tile: tiles.stamen_toner
        };
    }

    getRef = () => {
        return this.mapRef.current;
    }

    onBoundsChanged = (bounds) => {
        if (this.props.onBoundsChanged) {
            this.props.onBoundsChanged(bounds);
        }
    }

    onViewportChanged = (viewport) => {
        if (this.props.onViewportChanged) {
            this.props.onViewportChanged(viewport);
        }
    }

    componentDidUpdate(prevProps) {
        // we only want to use the viewport
        //  on initialization
        if (this.state.initial_viewport && prevProps.initialViewport) {
            this.setState({initial_viewport: false});
        }
    }

    render() {
        let extra_props = {};
        if (this.props.initialViewport && this.state.initial_viewport != null) {
            extra_props = {
                viewport: this.props.initialViewport
            };
        } else {
            extra_props = {
                center: this.state.center,
                zoom: this.state.zoom
            };
        }

        return (
            <div className="map-container">
                <BoundsMap
                    ref={this.mapRef}
                    zoomControl={false}
                    onBoundsChanged={this.onBoundsChanged}
                    onViewportDidChange={this.onViewportChanged}
                    {...extra_props}
                    >

                    <TileLayer
                        attribution={this.props.showAttribution ? this.state.tile.attribution : ''}
                        url={this.state.tile.url}
                        subdomains={this.state.tile.subdomains}
                        />

                    {this.props.children}

                </BoundsMap>
            </div>
        );
    }
}

export default BaseMap;
