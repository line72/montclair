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

import React, { createRef, Component } from 'react';

import StopOverlay from './StopOverlay';
import Route from './Route';

class StopEstimatesContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            stopOverlay: this.props.stopOverlay,
            selectedArrival: this.props.stopOverlay.arrivals[0] || null,
            selectedVehicle: null
        };
        this.ref = createRef();
        this.updateTimer = setInterval(() => { this.update();}, 10000);
        this.update();
    }

    componentDidMount() {
        // zoom in on the stop
        if (!this.state.selectedVehicle) {
            if (this.state.stopOverlay.stop && this.ref.current && this.ref.current.getMap()) {
                this.ref.current.getMap().leafletElement.setView(this.state.stopOverlay.stop.position);
            }
        }
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
            const selectedArrival = this.state.selectedArrival;
            // get the vehicle
            this.state.stopOverlay.agency.parser.getVehicle(this.state.selectedArrival.route, this.state.selectedArrival.vehicleId)
                .then((vehicle) => {
                    // !mwd - avoid concurrency issues. It is possible that while
                    //  we were fetching, the user already selected a different
                    //  arrival, so only actually set this state if the arrivals
                    //  still match
                    if (this.state.selectedArrival === selectedArrival) {
                        if (vehicle && this.state.stopOverlay.stop && this.ref.current && this.ref.current.getMap()) {
                            this.ref.current.getMap().leafletElement.fitBounds([
                                this.state.stopOverlay.stop.position,
                                vehicle.position
                            ], {padding: [30, 30]});
                        }

                        this.setState({selectedVehicle: vehicle});
                    }
                });
        }

    }

    fetchArrivals = (agency, stop_id) => {
        agency.parser.getArrivalsFor(stop_id, agency.routes)
            .then((arrivals) => {
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
        this.setState((state) => {
            return {
                selectedArrival: arrival
            };
        });
        // get the vehicle
        this.state.stopOverlay.agency.parser.getVehicle(arrival.route, arrival.vehicleId)
            .then((vehicle) => {
                if (vehicle && this.state.stopOverlay.stop && this.ref.current && this.ref.current.getMap()) {
                    this.ref.current.getMap().leafletElement.fitBounds([
                        this.state.stopOverlay.stop.position,
                        vehicle.position
                    ], {padding: [30, 30]});
                }
                this.setState({selectedVehicle: vehicle});
            });
    }

    renderVehicle = () => {
        if (this.state.selectedVehicle) {
            const route = this.state.stopOverlay.agency.routes[this.state.selectedVehicle.route_id];
            const agency = this.state.stopOverlay.agency;
            return (
                <Route key={route.id}
                       agency={agency}
                       route={route}
                       id={route.id}
                       number={route.number}
                       name={route.name}
                       selected={true}
                       color={route.color}
                       vehicles={[this.state.selectedVehicle]}
                       stops={[]}
                       onStopClicked={(props, stop) => {}}
                  />
            );
        } else {
            return null;
        }
    }

    render() {
        return (
            <StopOverlay ref={this.ref}
                         key="stop-overlay"
                         visible={this.state.stopOverlay.visible}
                         stop={this.state.stopOverlay.stop}
                         name={this.state.stopOverlay.name}
                         arrivals={this.state.stopOverlay.arrivals}
                         fetching={this.state.stopOverlay.fetching}
                         vehicle={this.state.selectedVehicle}
                         initialViewport={this.props.initialViewport}
                         onSelected={this.onArrivalSelected}
                         onClose={() => {this.props.onClose()}}
            >
              {this.renderVehicle()}
            </StopOverlay>
        );
    }
}

export default StopEstimatesContainer;
