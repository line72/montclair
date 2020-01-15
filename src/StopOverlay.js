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
import moment from 'moment';

import './StopOverlay.css';

class StopOverlay extends Component {
    renderArrivals() {
        if (this.props.fetching) {
            return (
                <tr key="Loading">
                  <td colSpan={3} className="w3-center">
                    <i className="fa fa-spinner fa-pulse w3-xxlarge"></i>
                  </td>
                </tr>
            );
        } else if (this.props.arrivals.length === 0) {
            return (
                <tr key="No arrivals">
                  <td colSpan={3}>
                    No Upcoming Arrivals
                  </td>
                </tr>
            );
        } else {
            return this.props.arrivals.map((a, i) => {
                const arrival = (a.arrival.diff(moment()) > 1000 * 60 * 60) ? a.arrival.format('LT') : a.arrival.fromNow();
                return (
                    <tr key={i}>
                      <td>{arrival}</td>
                      <td className="w3-tag" style={{backgroundColor: `#${a.route.color}`}}>{a.route.number}</td>
                      <td>{a.direction}</td>
                    </tr>
                );
            });
        }
    }

    render() {
        let style = {display: 'none'};
        if (this.props.visible) {
            style = {display: 'block'};
        }

        return (
            <div className="w3-modal StopOverlay-modal" style={style}>
              <div className="w3-modal-content w3-card-4 w3-animate-bottom StopOverlay-content">
                <div className="w3-center"><br />
                  <span onClick={() => this.props.onClose()}
                        className="w3-button w3-xlarge w3-hover-red w3-display-topright"
                        title="Close Modal">&times;</span>
                  <h3 title={this.props.name}>{this.props.name}</h3>
                  <div className="w3-container StopOverlay-table">
                    <table className="w3-table w3-striped w3-bordered">
                      <thead>
                        <tr>
                          <td colSpan={3}>
                            Next Arrivals
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {this.renderArrivals()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
        );
    }
}

export default StopOverlay;
