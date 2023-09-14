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
import L from 'leaflet';

class RouteType {
    constructor({id, number, name, color, kml, polyline, polylineDeferred}) {
        this.id = id;
        this.number = number;
        this.name = name;
        this.color = color;
        this.selected = false;
        this.kml = kml;
        this.polyline = polyline;
        this.polylineDeferred = polylineDeferred;
        this.visible = true;

        this.stops = [];

        this.vehicles = [];
    }

    async getPath() {
        if (this.kml != null) {
            return axios.get(this.kml).then((response) => {
                let xml = new DOMParser().parseFromString(response.data, 'text/xml');
                return toGeoJSON.kml(xml);
            });
        } else if (this.polyline != null) {
            return new Promise((resolve, reject) => {
                const l = L.polyline(this.polyline);

                resolve(l.toGeoJSON());
            });
        } else if (this.polylineDeferred != null) {
            return this.polylineDeferred().then((response) => {
                this.polyline = response;

                const l = L.polyline(this.polyline);

                return l.toGeoJSON();
            });
        } else {
            return new Promise((resolve, reject) => {
                resolve(null);
            });
        }
    }
}

export default RouteType;
