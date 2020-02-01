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

function doBuild({url}) {
    let p = new Parser(url);
    let r = p.build();
    if (r) {
        return {
            status: true,
            result: r
        }
    } else {
        return {
            status: false,
            result: 'Error parsing GTFS data'
        }
    }
}

onmessage = function({data}) {
    console.log('onmessage', data);
    switch (data.message) {
    case 'BUILD':
        const result = doBuild(data);
        postMessage({id: data.id, ...result});

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
