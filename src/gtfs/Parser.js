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

import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';

class Parser {
    constructor(url) {
        this.url = url;

        this.KNOWN = [
            'agency.txt',
            'calendar.txt',
            'calendar_dates.txt',
            'fare_attributes.txt',
            'fare_rules.txt',
            'routes.txt',
            'shapes.txt',
            'stop_times.txt',
            'stops.txt',
            'trips.txt'
        ];
    }

    build() {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
            return JSZip.loadAsync(resp.arrayBuffer());
        }).then((unzipped) => {
            // just get the .txt files
            unzipped.file(/.*\.txt$/).map((zipObject) => {
                // only worry about the files we care about
                if (this.KNOWN.includes(zipObject.name)) {
                    console.log('ayncing', zipObject.name)
                    zipObject.async('text')
                        .then((success) => {
                            console.log('success', success);
                        }, (err) => {
                            console.log('err', err);
                        });
                } else {
                    console.log('skipping', zipObject.name)
                    return null;
                }
            });
            return true;
        });
    }
}

export default Parser;
