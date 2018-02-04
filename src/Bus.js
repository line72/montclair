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
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Configuration from './Configuration';

class Bus extends Component {
    constructor(props) {
        super(props);

        let configuration = new Configuration();
        this.url = configuration.base_url + `/IconFactory.ashx?library=busIcons\\mobile&colortype=hex&color=${this.props.color}&bearing=${this.props.heading}`;
    }
    render() {
        const icon = L.icon({
            iconUrl: this.url,
            iconSize: [39, 50],
            iconAnchor: [20, 50],
            popupAnchor: [0, -50]
        });

        return (<Marker position={this.props.position}
                        icon={icon}>
                  <Popup onOpen={this.props.onOpen}
                         onClose={this.props.onClose}>
                    <span>
                      <span>Route: {this.props.route_id} - {this.props.route_name}</span><br/>
                      <span>Bus: {this.props.id}</span><br/>
                      <span>Riders: {this.props.on_board}</span><br/>
                      <span>Status: {this.props.status} ({this.props.deviation})</span>
                    </span>
                  </Popup>
                </Marker>);
    }
}

export default Bus;
