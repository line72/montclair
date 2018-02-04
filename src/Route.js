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
import Bus from './Bus';


class Route extends Component {
    constructor(props) {
        super(props);

        this.state = {
            geojson: null,
            selected: false
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
            let w = this.state.selected ? 7 : 1;

            return {
                color: `#${this.props.color}`,
                weight: w
            };
        };

        if (this.state.geojson != null) {
            let buses = this.props.vehicles.map((vehicle, index) => {
                let onOpen = () => {
                    this.setState({
                        selected: true
                    });
                }
                let onClose = () => {
                    this.setState({
                        selected: false
                    });
                }

                return (
                    <Bus key={vehicle.id}
                         id={vehicle.id}
                         position={vehicle.position}
                         heading={vehicle.heading}
                         route_id={vehicle.route_id}
                         route_name={this.props.name}
                         on_board={vehicle.on_board}
                         destination={vehicle.destination}
                         status={vehicle.op_status}
                         deviation={vehicle.deviation}
                         color={vehicle.color}
                         onOpen={onOpen}
                         onClose={onClose}
                         />
                );

            });

            return (
                <div>
                    <GeoJSON
                        data={this.state.geojson}
                        style={style} />
                    {buses}
                </div>
            );
        } else {
            return (<div />);
        }
    }
}

export default Route;
