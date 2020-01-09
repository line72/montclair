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

import './DeprecationNotice.css';

class DeprecationNotice extends Component {

    onClose = (evt) => {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render() {
        const visible = this.props.visible;

        if (visible) {
            return(
                <div id="deprecationModal" className="w3-modal">
                  <div className="w3-modal-content w3-card-4 ws-animate-top">
                    <header className="w3-container w3-red">
                      <span onClick={() => this.onClose()}
                            className="w3-button w3-display-topright">
                        &times;
                      </span>
                      <center>
                        <h3>Montclair has become Go Birmingham!</h3>
                      </center>
                    </header>
                    <div className="w3-container">
                      <p>Montclair will no longer receive updates. To continue getting new updates, please use the new <a href="https://birmingham.gotransitapp.com">Go Birmingham</a> app. It's the same app you love, but with a new name.</p>
                      <div className="w3-center">
                        <div className="w3-bar">
                          <a className="w3-button w3-black w3-hover-black w3-round"
                             href="https://birmingham.gotransitapp.com"
                             style={
                                 {
                                     display: "inline-block",
                                     overflow: "hidden",
                                     background: "url(https://birmingham.gotransitapp.com/app-icon.png)",
                                     backgroundRepeat: "no-repeat",
                                     backgroundPosition: "5% 50%",
                                     backgroundSize: "30px 30px",
                                     noRepeat: true,
                                     width: "135px",
                                     height: "40px"
                                 }
                             }>Website</a>
                          <a className="w3-button"
                             href="https://apps.apple.com/us/app/go-birmingham/id1493404090?mt=8"
                             style={
                                 {
                                     display: "inline-block",
                                     overflow: "hidden",
                                     background: "url(https://linkmaker.itunes.apple.com/en-us/badge-lrg.svg?releaseDate=2020-01-03&kind=iossoftware&bubble=ios_apps)",
                                     noRepeat: true,
                                     width: "135px",
                                     height: "40px"
                                 }
                             }></a>
                          <a className="w3-button"
                             href='https://play.google.com/store/apps/details?id=net.line72.montclair'
                             style={
                                 {
                                     display: "inline-block",
                                     overflow: "hidden",
                                     background: "url(https://play.google.com/intl/en_us/badges/images/generic/en-play-badge.png)",
                                     backgroundPosition: "-10px -10px",
                                     backgroundSize: "155px 60px",
                                     noRepeat: true,
                                     width: "135px",
                                     height: "40px"
                                 }
                             }>
                          </a>
                        </div>
                      </div>

                      <p></p>
                    </div>
                  </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

export default DeprecationNotice;
