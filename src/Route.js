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
import axios from 'axios';
import { GeoJSON } from 'react-leaflet';
import toGeoJSON from 'togeojson';

import Configuration from './Configuration';

class Route extends Component {
    constructor(props) {
	super(props);

	this.state = {
	    geojson: null
	};

	// fetch the kml
	axios.get(this.props.path).then((response) => {
	    console.log(`Received vehicles for ${this.props.id}: ${response.data}`);
	    // parse the xml and convert to geojson
	    let xml = new DOMParser().parseFromString(response.data, 'text/xml');
	    let geojson = toGeoJSON.kml(xml);
	    console.log(`geojson=${geojson}`);
	    this.setState({
		geojson: geojson
	    });
	});

    }

    render() {
	if (this.state.geojson != null) {
	    return (<GeoJSON key={this.props.id} data={this.state.geojson} />);
	} else {
	    return (<div />);
	}
    }
}

export default Route;
