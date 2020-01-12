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
import { CircleMarker, Popup } from 'react-leaflet';

import './Stop.css';

class Stop extends Component {
    constructor(props) {
        super(props);

        this.state = {
            arrivals: []
        };
        this.timerID = null;
    }

    onOpen() {
        clearInterval(this.timerID);

        // kick of initial version
        this.getArrivals();

        // set up an update timer
        this.timerID = setInterval(
            () => this.getArrivals(),
            20000
        );
    }

    onClose() {
        clearInterval(this.timerID);
        this.timerID = null;
    }

    getArrivals() {
        this.props.agency.parser.getArrivalsFor(this.props.id)
            .then((arrivals) => {
                console.log('arrivals', arrivals);
                this.setState({arrivals: arrivals});
            });
    }

    renderArrivals() {
        return this.state.arrivals.map((a, i) => {
            return (
                <tr key={i}>
                  <td>{a.arrival.fromNow()}</td>
                  <td>{a.route_id}</td>
                </tr>
            );
        });
    }

    render() {
        return (
            <CircleMarker
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
              <Popup
                onOpen={() => this.onOpen() }
                onClose={() => this.onClose() }
              >
                <div>
                  <h2 className="Stop-header">{this.props.name}</h2>
                  <table className="Stop-table">
                    <thead>
                      <tr>
                        <td colSpan={2}>
                          Next Departures
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {this.renderArrivals()}
                    </tbody>
                  </table>
                </div>
              </Popup>
            </CircleMarker>
        );
    }
}

export default Stop;
