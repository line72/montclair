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
import Bus from './Bus';

class StopEstimatesContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedArrival: this.props.stopOverlay.arrivals[0] || null,
            selectedVehicle: null
        };
        this.updateTimer = setInterval(() => { this.update();}, 10000);
    }

    componentWillUnmount() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        this.updateTimer = null;
    }

    update = () => {
        if (this.state.selectedArrival) {
            // get the vehicle
            this.props.stopOverlay.agency.parser.getVehicle(this.state.selectedArrival.route, this.state.selectedArrival.vehicleId)
                .then((vehicle) => {
                    this.setState({selectedVehicle: vehicle});
                });
        }
    }

    onArrivalSelected = (stop, arrival) => {
        this.setState({
            selectedArrival: arrival
        });
        // get the vehicle
        this.props.stopOverlay.agency.parser.getVehicle(arrival.route, arrival.vehicleId)
            .then((vehicle) => {
                this.setState({selectedVehicle: vehicle});
            });
    }

    renderVehicle = () => {
        if (this.state.selectedVehicle) {
            return (
                <Bus
                  position={this.state.selectedVehicle.position}
                  color={this.state.selectedVehicle.color}
                  heading={this.state.selectedVehicle.heading}
                  route_name=""
                  onOpen={() => {}}
                  onClose={() => {}}
                />
            );
        } else {
            return null;
        }
    }

    render() {
        return (
            <StopOverlay key="stop-overlay"
                         visible={this.props.stopOverlay.visible}
                         stop={this.props.stopOverlay.stop}
                         name={this.props.stopOverlay.name}
                         arrivals={this.props.stopOverlay.arrivals}
                         fetching={this.props.stopOverlay.fetching}
                         vehicle={this.state.selectedVehicle}
                         onSelected={this.onArrivalSelected}
                         onClose={() => {this.props.onClose()}}
            >
              {this.renderVehicle()}
            </StopOverlay>
        );
    }
}

export default StopEstimatesContainer;
