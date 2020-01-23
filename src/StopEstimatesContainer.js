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
            stopOverlay: this.props.stopOverlay,
            selectedArrival: this.props.stopOverlay.arrivals[0] || null,
            selectedVehicle: null
        };
        this.updateTimer = setInterval(() => { this.update();}, 10000);
        this.update();
    }

    componentWillUnmount() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        this.updateTimer = null;
    }

    update = () => {
        // fetch new arrivals
        this.fetchArrivals(this.state.stopOverlay.agency, this.state.stopOverlay.id);

        // fetch vehicle postion
        if (this.state.selectedArrival) {
            // get the vehicle
            this.state.stopOverlay.agency.parser.getVehicle(this.state.selectedArrival.route, this.state.selectedArrival.vehicleId)
                .then((vehicle) => {
                    this.setState({selectedVehicle: vehicle});
                });
        }

    }

    fetchArrivals = (agency, stop_id) => {
        agency.parser.getArrivalsFor(stop_id, agency.routes)
            .then((arrivals) => {
                console.log('got arrivals', arrivals);
                this.setState((state) => {
                    return {
                        stopOverlay: {...state.stopOverlay,
                                      arrivals: arrivals,
                                      fetching: false,
                                      visible: true
                                     }
                    };
                });
            });
    }

    onArrivalSelected = (stop, arrival) => {
        this.setState({
            selectedArrival: arrival
        });
        // get the vehicle
        this.state.stopOverlay.agency.parser.getVehicle(arrival.route, arrival.vehicleId)
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
                         visible={this.state.stopOverlay.visible}
                         stop={this.state.stopOverlay.stop}
                         name={this.state.stopOverlay.name}
                         arrivals={this.state.stopOverlay.arrivals}
                         fetching={this.state.stopOverlay.fetching}
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
