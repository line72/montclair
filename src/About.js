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
import AttributionModal from './AttributionModal';

import packageJson from '../package.json';
import './About.css';

class About extends Component {
    constructor(props) {
        super(props);

        this.state = {
            attributionsVisible: 'none'
        };
    }

    onAttributionsClicked(e) {
        this.setState({
            attributionsVisible: 'none'
        });
    }

    render() {
        return (
            <div className="w3-bar-item w3-light-grey About">
              <hr />
              <p>© 2020 Marcus Dillavou</p>
              <p><a href="https://gotransitapp.com">Go Transit</a></p>
              <p>Version: {packageJson.version}</p>
              <span>
                <a href="https://gotransitapp.com/privacy.html">Privacy Policy</a>
              </span>
              &nbsp;|&nbsp;
              <span>
                <button className="link-button"
                   onClick={() => this.setState({attributionsVisible: 'block'})}>
                  Legal
                </button>
              </span>

              <AttributionModal display={this.state.attributionsVisible}
                                onClick={(e) => this.onAttributionsClicked(e) } />

            </div>
        );
    }
}

export default About;
