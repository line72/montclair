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
import './FirstRunHint.css';

class FirstRunHint extends Component {
    render() {
        const first_run = this.props.isFirstRun;
        let display = 'none';
        if (first_run) {
            display = 'block';
        }

        return (<div className="FirstRunHint w3-hide-medium w3-hide-small" style={{display: display}}>
                Welcome to Birmingham, AL's Real Time Bus Tracker.<br /><br />
                Please select one or more routes to begin!
                </div>);
    }
}

export default FirstRunHint;
