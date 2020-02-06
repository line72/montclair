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

function doBuild({name, url}) {
    console.log('doBuild', name, url);
    let p = new Parser(name, url);
    return p.build().then((r) => {
        console.log('r=', r);
        return {
            status: true,
            result: r
        };
    });
}

function startVehicleUpdate({dbName, url}) {
    console.log('start Vehicle Update');

    let p = new RTVehicleParser(dbName, url);
    p.update();

    setInterval(() => { p.update(); }, 10000);
}

onmessage = function({data}) {
    console.log('onmessage', data);
    switch (data.message) {
    case 'BUILD':
        doBuild(data.data)
            .then((result) => {
                console.log('posting result', result);
                postMessage({id: data.id, ...result});
            })
            .catch((err) => {
                console.warn(`gtfs-parser: Error building: ${err}`);
                postMessage({
                    id: data.id,
                    status: false,
                    result: err
                });
            });

        break;
    case 'VEHICLE_UPDATE_START':
        startVehicleUpdate(data.data);
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
}
