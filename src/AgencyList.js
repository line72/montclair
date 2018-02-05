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

import './AgencyList.css';
import './images/checked.svg';

class AgencyList extends Component {
    onOpen() {
        document.getElementById("sidebar").style.display = "block";
        document.getElementById("sidebar-overlay").style.display = "block";
    }

    onClose() {
        document.getElementById("sidebar").style.display = "none";
        document.getElementById("sidebar-overlay").style.display = "none";
    }

    render() {
        const agencies = this.props.agencies.map((agency, index) => {
            let routes = Object.keys(agency.routes).map((key, index) => {
                let route = agency.routes[key];
                return (
                    <span className="AgencyList-route w3-bar-item">
                        <span
                            key={route.id}
                            className="AgencyList-route-name">
                            {route.name}
                        </span>
                        <button className="AgencyList-checked w3-button" />
                    </span>
                );
            });

            return (
                <span className="AgencyList-agency">
                    <span className="AgencyList-header">{agency.name}</span>
                    {routes}
                </span>
            );
        });

        return(
            <div>
                <nav className="w3-sidebar w3-bar-block w3-white w3-collapse w3-top AgencyList-sidebar" id="sidebar">
                    {/* Close Button */}
                    <div className="w3-container w3-display-container">
                        <i onClick={() => this.onClose()} className="fa fa-remove w3-hide-large w3-button w3-display-topright"></i>
                        {/*
                        <span className="w3-medium w3-text-grey AgencyList-padding-0">
                            <span className="w3-bar-item AgencyList-padding-0">
                            </span>
                        </span>
                        */}
                    </div>

                    {/* items */}
                    <div className="w3-padding-64 w3-large w3-text-grey">
                        {agencies}
                    </div>
                </nav>

                {/* Top menu on small screens */}
                <header className="w3-bar w3-top w3-hide-large w3-black w3-xlarge">
                    <div className="w3-bar-item w3-padding-24 w3-wide AgencyList-bar-item">
                        Birmingham Transit
                    </div>
                    <button className="w3-bar-item w3-button w3-padding-24 w3-right" onClick={() => this.onOpen()}>
                        <i className="fa fa-bars"></i>
                    </button>
                </header>

                {/* Overlay effect with sidebar */}
                <div className="w3-overlay w3-hide-large AgencyList-sidebar-overlay"
                     title="Close side menu"
                     id="sidebar-overlay"
                     onClick={() => this.onClose()}>
                </div>
            </div>
        );
    }
}

export default AgencyList;
