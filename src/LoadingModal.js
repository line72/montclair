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

import './w3.css';
import './LoadingModal.css';

class LoadingModal extends Component {
    render() {
        return (
            <div id="LoadingModal-Modal" className="w3-modal">
              <div id="LoadingModal-Content" className="w3-modal-content w3-round-xlarge w3-light-grey">
                <div id="LoadingModal-SpinnerContainer" className="w3-container w3-center">
                  <div id="LoadingModal-Message" className="w3-center">
                    <h2>Initializing App...</h2>
                    <i id="LoadingModal-Spinner" className="fa fa-spinner fa-pulse w3-xxlarge"></i>
                  </div>
                </div>
              </div>
            </div>
        );
    }
}

export default LoadingModal;
