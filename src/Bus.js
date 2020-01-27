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

import BusIcon from './BusIcon';

import './Bus.css';

class Bus extends Component {
    constructor(props) {
        super(props);

        this.state = {
            icon: null,
            color: this.props.color,
            heading: this.props.heading
        };
    }

    render() {
        if (!this.state.icon || this.state.color !== this.props.color || this.state.heading !== this.props.heading) {
            const busIcon = new BusIcon(this.props.color, this.props.heading);
            busIcon.build()
                .then((icon) => {
                    this.setState({
                        color: this.props.color,
                        heading: this.props.heading,
                        icon: icon
                    });
                });
        }

        if (!this.state.icon) {
            return null;
        }

        return (
            <Marker position={this.props.position}
                    icon={this.state.icon ? this.state.icon : ''}>
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
