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

import axios from 'axios';
import toGeoJSON from '@mapbox/togeojson';

class RouteType {
    constructor({id, name, color, kml}) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.selected = false;
        this.kml = kml;

        this.vehicles = []
    }

    async getPath() {
        if (this.kml != null) {
            return axios.get(this.kml).then((response) => {
                let xml = new DOMParser().parseFromString(response.data, 'text/xml');
                return toGeoJSON.kml(xml);
            });
        } else {
            new Promise((resolve, reject) => {
                resolve(null);
            })
        }
    }
}

export default RouteType;
