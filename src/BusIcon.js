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

import axios from 'axios';
import L from 'leaflet';

class BusIcon {
    constructor(color, heading) {
        this.color = color;
        this.heading = heading;
    }

    build = () => {
        return axios.get('/bus-icon.svg')
            .then((svg) => {
                // load the svg
                let xml = new DOMParser().parseFromString(svg.data, 'image/svg+xml');
                // update the attributes //

                // 1. the gradient
                // stop1
                let stop1 = xml.querySelector('#stop958');
                stop1.style.stopColor = '#' + this.color;
                // stop2
                let stop2 = xml.querySelector('#stop960');
                stop2.style.stopColor = '#' + this.color;
                stop2.style.stopOpacity = 0.6;

                // 2. the marker
                let marker = xml.querySelector('#marker');
                marker.style.stroke = '#' + this.color;

                // 3. the bus
                let bus = xml.querySelector('#bus');
                bus.style.fill = '#' + this.color;

                // 4. the arrow + polygon
                let arrow = xml.querySelector('#right_arrow');
                arrow.style.fill = '#' + this.color;
                let polygon1160 = xml.querySelector('#polygon1160');
                polygon1160.style.fill = '#' + this.color;

                // 5. The bearing, set its rotation
                let bearing = xml.querySelector('#bearing');
                bearing.setAttribute('transform', `rotate(${this.heading}, 250, 190)`);

                let serialized = new XMLSerializer().serializeToString(xml);
                const url = 'data:image/svg+xml;base64,' + btoa(serialized);

                // return a leaflet icon
                return L.icon({
                    iconUrl: url,
                    iconSize: [60, 60],
                    iconAnchor: [30, 60],
                    popupAnchor: [0, -60]
                })
            });
    }
}

export default BusIcon;
