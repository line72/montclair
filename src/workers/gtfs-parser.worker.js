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

import Parser from '../gtfs/Parser';
import RTVehicleParser from '../gtfs/RTVehicleParser';
import RTTripParser from '../gtfs/RTTripParser';

function doBuild({name, url}) {
    let p = new Parser(name, url);
    return p.build().then((r) => {
        return {
            status: true,
            result: r
        };
    });
}

function startVehicleUpdate({dbName, url}) {
    let p = new RTVehicleParser(dbName, url);
    p.update();

    setInterval(() => { p.update(); }, 10000);
}

function fetchStopEstimates({id, data: {url, stopId}}) {
    let p = new RTTripParser(url);
    p.update(stopId)
        .then((stopInfo) => {
            postMessage({
                id: id,
                status: true,
                result: stopInfo
            });
        })
        .catch((err) => {
            console.warn(`gtfs-parser: Error fetching stop updates: ${err}`);
            postMessage({
                id: id,
                status: false,
                result: `${err}`
            });
        });
}

onmessage = function({data}) {
    switch (data.message) {
    case 'BUILD':
        doBuild(data.data)
            .then((result) => {
                postMessage({id: data.id, ...result});
            })
            .catch((err) => {
                console.warn(`gtfs-parser: Error building: ${err}`);
                postMessage({
                    id: data.id,
                    status: false,
                    result: `${err}`
                });
            });

        break;
    case 'VEHICLE_UPDATE_START':
        startVehicleUpdate(data.data);
        break;
    case 'FETCH_STOP_ESTIMATES':
        fetchStopEstimates(data);
        break;
    default:
        console.warn(`gtfs-parser: Unknown message type: ${data.message}`);
        postMessage({
            id: data.id,
            status: false,
            result: `Unknown message type: ${data.message}`
        });
        break;
    }
};
