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
import RouteContainer from './RouteContainer';
import DeprecationNotice from './DeprecationNotice';

import './App.css';
import './w3.css';
import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';

class App extends Component {
    constructor() {
        super();

        this.state = {
            deprecationNoticeVisible: true
        };
    }

    onDeprecationClosed = () => {
        console.log('onDeprecationClosed');

        this.setState({
            deprecationNoticeVisible: false
        });
    }

    render() {
        return (
            <div className="App">
              <DeprecationNotice visible={this.state.deprecationNoticeVisible}
                                 onClose={() => this.onDeprecationClosed()}/>
              <RouteContainer />
            </div>
        );
    }
}

export default App;
