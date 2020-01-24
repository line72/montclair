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
import { GeoJSON } from 'react-leaflet';
import Bus from './Bus';
import Stop from './Stop';

class Route extends Component {
    constructor(props) {
        super(props);

        this.state = {
            geojson: null,
            selected: this.props.selected || false
        };

        // fetch the kml
        this.props.route.getPath().then((geojson) => {
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

            let route_name = `${this.props.number} - ${this.props.name}`;

            return (
                <Bus key={vehicle.id}
                     id={vehicle.id}
                     position={vehicle.position}
                     heading={vehicle.heading}
                     route_id={vehicle.route_id}
                     route_name={route_name}
                     on_board={vehicle.on_board}
                     destination={vehicle.destination}
                     status={vehicle.op_status}
                     deviation={vehicle.deviation}
                     color={this.props.color}
                     onOpen={onOpen}
                     onClose={onClose}
                     />
            );

        });

        let stops = this.props.stops.map((stop, index) => {
            return (
                <Stop key={stop.id}
                      agency={this.props.agency}
                      id={stop.id}
                      name={stop.name}
                      position={stop.position}
                      onClick={(props) => this.props.onStopClicked(props, stop)}
                />
            );
        });

        if (this.state.geojson != null) {
            return (
                <div>
                  <GeoJSON
                    data={this.state.geojson}
                    style={style} />
                  {buses}
                  {stops}
                  {this.props.children}
                </div>
            );
        } else {
            return (
                <div>
                  {buses}
                  {stops}
                </div>
            );
        }
    }
}

export default Route;
