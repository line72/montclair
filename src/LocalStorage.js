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
        let v = localStorage.getItem('state');
        if (v !== null) {
            this.state = this.loadState(v);

            // no longer the first time
            this.state.is_first_run = false;
            this.saveState();
        } else {
            this.state = this.initialState();
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
        return this.state.visibility;
    }

    isAgencyVisible(agency) {
        if (agency.name in this.state.visibility) {
            return this.state.visibility[agency.name]['visible'];
        }

        // default to true
        return true;
    }

    isRouteVisible(agency, route) {
        if (agency.name in this.state.visibility &&
            route.id in this.state.visibility[agency.name]['routes']) {
            return this.state.visibility[agency.name]['routes'][route.id];
        }

        // default to false
        return false;
    }

    isFirstRun() {
        return this.state.is_first_run;
    }

    updateVisibility(agencies) {
        this.state.visibility = agencies.reduce((acc, agency) => {
            let route_keys = Object.keys(agency.routes).reduce((acc2, key) => {
                let route = agency.routes[key];

                acc2[route.id] = route.visible;
                return acc2;
            }, {});

            acc[agency.name] = {visible: agency.visible,
                                routes: route_keys};
            return acc;
        }, {});

        // user has selected something
        this.state.is_first_run = false;

        this.saveState();
    }

    updateBounds(bounds) {
        this.state.bounds = bounds;
        this.saveState();
    }

    updateViewport(viewport) {
        this.state.viewport = viewport;
        this.saveState();
    }

    initialState() {
        return {
            is_first_run: true,
            bounds: null,
            viewport: null,
            visibility: {}
        }
    }

    loadState(v) {
        let initial_state = this.initialState();
        let state = JSON.parse(v);

        let combined = {
            ...initial_state,
            ...state
        };

        return combined;
    }

    saveState() {
        localStorage.setItem('state', JSON.stringify(this.state));
    }
}

export default LocalStorage;
