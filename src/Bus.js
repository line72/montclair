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
import renderIf from 'render-if';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import './Bus.css';

class Bus extends Component {
    render() {
        const url = `https://realtimebjcta.availtec.com/InfoPoint/IconFactory.ashx?library=busIcons\\mobile&colortype=hex&color=${this.props.color}&bearing=${this.props.heading}`;

        let icon = L.icon({
            iconUrl: url,
            iconSize: [39, 50],
            iconAnchor: [20, 50],
            popupAnchor: [0, -50]
        });

        return (
            <Marker position={this.props.position}
                    icon={icon}>
                <Popup onOpen={this.props.onOpen}
                       onClose={this.props.onClose}>
                    <table className="Bus-table">
                        <tbody>
                            <tr>
                                <td className="Bus-header">Route:</td>
                                <td>{this.props.route_name}</td>
                            </tr>
                            {
                                renderIf(this.props.destination !== '')(
                                    <tr>
                                        <td className="Bus-header">Destination:</td>
                                        <td>{this.props.destination}</td>
                                    </tr>
                                )
                            }
                            {
                                renderIf(this.props.on_board !== '')(
                                    <tr>
                                        <td className="Bus-header">Riders:</td>
                                        <td>{this.props.on_board}</td>
                                    </tr>
                                )
                            }
                            {
                                renderIf(this.props.status !== '')(
                                    <tr>
                                        <td className="Bus-header">Status:</td>
                                        <td>{this.props.status} ({this.props.deviation} minutes)</td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </Popup>
            </Marker>
        );
    }
}

export default Bus;
