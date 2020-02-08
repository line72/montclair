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

import './ErrorPage.css';

class ErrorPage extends Component {
    render() {
        return (
            <div id="ErrorPage" className="w3-container w3-light-grey">
              <div className="w3-row">
                <div className="w3-half">
                  <img src="/bus-crashing.gif" alt="Bus crashing" className="w3-round-xlarge w3-grayscale-max" />
                </div>
                <div className="w3-half">
                  <h1>Oh no!</h1>
                  <h3>Looks like there was an error on this page.</h3>
                  <h3>Try refreshing or trying again later.</h3>
                  <a href="mailto:info@gotransitapp.com">
                    <button className="w3-button w3-border w3-border-light-grey w3-round-large">Contact Support</button>
                  </a>
                </div>
              </div>
            </div>
        );
    }
}

export default ErrorPage;
