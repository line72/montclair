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

import packageJson from '../package.json';
import './About.css';

class About extends Component {
    render() {
        return (
            <div className="w3-bar-item w3-light-grey About">
              <hr />
              <p>© 2020 Marcus Dillavou</p>
              <p><a href="https://gotransitapp.com">Go Transit</a></p>
              <p>Version: {packageJson.version}</p>
            </div>
        );
    }
}

export default About;
