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
import { CircleMarker } from 'react-leaflet';

import './Stop.css';

class Stop extends Component {
    render() {
        return (
            <CircleMarker
              onclick={() => this.props.onClick({agency: this.props.agency, id: this.props.id, name: this.props.name})}
              center={this.props.position}
              radius={7}
              stroke={true}
              color={'#000000'}
              weight={2}
              opacity={1.0}
              fill={true}
              fillColor={'#dedede'}
              fillOpacity={1.0}
            >
            </CircleMarker>
        );
    }
}

export default Stop;
