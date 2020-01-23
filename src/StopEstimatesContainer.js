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

import StopOverlay from './StopOverlay';

class StopEstimatesContainer extends Component {
    render() {
        return (
            <StopOverlay key="stop-overlay"
                         visible={this.props.stopOverlay.visible}
                         name={this.props.stopOverlay.name}
                         arrivals={this.props.stopOverlay.arrivals}
                         fetching={this.props.stopOverlay.fetching}
                         onClose={() => {this.props.onClose()}}
            />
        );
    }
}

export default StopEstimatesContainer;
