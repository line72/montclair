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

import './AttributionModal.css';

import MIT from './licenses/mit.js';
import GPLV3 from './licenses/gplv3.js';
import APACHE2 from './licenses/apache2.0.js';

class AttributionModal extends Component {
    constructor(props) {
        super(props);

        this.attributsions = [
            {
                name: 'React',
                copyright: '2020 Facebook',
                website: 'https://reactjs.org/',
                license: 'mit'
            },
            {
                name: 'PouchDB',
                copyright: '2020 PouchDB',
                website: 'https://pouchdb.com/',
                license: 'apache2.0'
            },
            {
                name: 'JSZip',
                copyright: '2020 JSZip',
                website: 'https://stuk.github.io/jszip/',
                license: 'gplv3'
            },
            {
                name: 'moment',
                copyright: '2020 Moment',
                website: 'https://momentjs.com/',
                license: 'mit'
            },
            {
                name: 'GTFS Realtime Bindings',
                copyright: '2020 MobilityData',
                website: 'https://github.com/MobilityData/gtfs-realtime-bindings#readme',
                license: 'apache2.0'
            },
            {
                name: 'Papa Parse',
                copyright: '2020 Papa Parse',
                website: 'https://www.papaparse.com/',
                license: 'mit'
            }
        ];

        this.licenses = {
            mit: {
                name: 'MIT',
                license: MIT
            },
            'apache2.0': {
                name: 'Apache 2.0',
                license: APACHE2
            },
            gplv3: {
                name: 'GPLv3',
                license: GPLV3
            }
        };
    }

    renderAttribution(key) {
        return (
            <div className="w3-col s12 m6 l4">
              <div key={key.name} className="attribution w3-card">
                <header className="w3-container w3-blue">
                  <strong>{key.name}</strong> - Copyright(c) {key.copyright}
                </header>
                <div className="w3-container attribution">
                  <p>License: {this.licenses[key.license].name}</p>
                </div>
                <footer className="w3-container w3-light-grey">
                  <p><a href={key.website}>Website</a></p>
                </footer>
              </div>
            </div>
        );
    }

    renderLicense(license) {
        return (
            <div key={license.name} className="license">
              <h2>{license.name}</h2>
              <code>
                {license.license}
              </code>
            </div>
        );
    }

    render() {
        return (
            <div className="AttributionModal w3-modal"
                 style={{display: this.props.display}}
            >
              <div className="w3-modal-content w3-card-4 w3-animate-bottom">
                <div className="w3-container w3-center-align">
                  <span
                    className="w3-button w3-display-topright"
                    onClick={e => this.props.onClick(e)}>
                    &times;
                  </span>
                  <h1>Attributions:</h1>
                  <div className="w3-row-padding w3-section">
                    {this.attributsions.map(key => this.renderAttribution(key))}
                  </div>
                  <hr />
                  <h1>Licenses</h1>
                  {Object.keys(this.licenses).map(key => this.renderLicense(this.licenses[key]))}

                </div>
              </div>
            </div>
        );
    }
}

export default AttributionModal;
