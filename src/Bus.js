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
import { CircleMarker } from 'react-leaflet';

class Bus extends Component {
    render() {
        const color = `#${this.props.color}`;

        console.log(`bus ${this.props.id} at ${this.props.position}`);
        return (<CircleMarker
                center={this.props.position}
                color={color}
                />);
    }
}

export default Bus;
