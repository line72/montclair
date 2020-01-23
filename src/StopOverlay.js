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
import moment from 'moment';
import { CircleMarker } from 'react-leaflet';

import BaseMap from './BaseMap';

import './StopOverlay.css';

class StopOverlay extends Component {
    constructor(props) {
        super(props);

        this.mapRef = createRef();
        this.state = {
            selected: null
        };
    }

    getMap = () => {
        if (this.mapRef.current) {
            return this.mapRef.current.getRef();
        }
        return null;
    }

    onEstimateClicked = (stop, arrival) => {
        /* hi-light */
        this.setState({selected: arrival});

        if (this.props.onSelected) {
            this.props.onSelected(stop, arrival);
        }
    }

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
                const selected = this.state.selected && this.state.selected.tripId === a.tripId && this.state.selected.route.id == a.route.id;
                return (
                    <tr key={i}
                        className={selected ? 'w3-blue-gray' : ''}
                        onClick={() => this.onEstimateClicked(this.props.stop, a)}>
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
            <div className="StopOverlay" style={style}>
              <div className="StopOverlay-map">
                <BaseMap
                  ref={this.mapRef}
                >
                  <CircleMarker
                    center={this.props.stop.position}
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
                  {this.props.children}
                 </BaseMap>
              </div>
              <div className="StopOverlay-content">
                <div className="w3-center StopOverlay-estimates"><br />
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
