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

class LocalStorage {
    constructor() {
        let v = localStorage.getItem('visibility');
        if (v !== null) {
            this.visibility = JSON.parse(v);
        } else {
            this.visibility = {}
        }
    }

    getVisibility() {
        // this is a hash of hashes of booleans:
        // {agency1_id: {visible: true,
        //               routes: {route1_id: true,
        //                        route2_id: false}},
        //  agency2_id: {visible: false,
        //               routes: {route1_id: true,
        //                       route2_id: true}}}
        return this.visibility;
    }

    isAgencyVisible(agency) {
        if (agency.name in this.visibility) {
            return this.visibility[agency.name]['visible'];
        }

        // default to true
        return true;
    }

    isRouteVisible(agency, route) {
        if (agency.name in this.visibility &&
            route.id in this.visibility[agency.name]['routes']) {
            return this.visibility[agency.name]['routes'][route.id];
        }

        // default to true
        return true;
    }

    updateVisibility(agencies) {
        this.visibility = agencies.reduce((acc, agency) => {
            let route_keys = Object.keys(agency.routes).reduce((acc2, key) => {
                let route = agency.routes[key];

                acc2[route.id] = route.visible;
                return acc2;
            }, {});

            acc[agency.name] = {visible: agency.visible,
                                routes: route_keys};
            return acc;
        }, {});

        localStorage.setItem('visibility', JSON.stringify(this.visibility));
    }
}

export default LocalStorage;
