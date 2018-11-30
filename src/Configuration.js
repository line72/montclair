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

import AvailtecParser from './AvailtecParser';
import TranslocParser from './TranslocParser';

class Configuration {
    constructor() {
        this.transloc_key = '';

        // Birmingham, AL
        this.center = [33.5084801, -86.8006611];

        this.agencies = [
            {
                name: 'BJCTA',
                parser: new AvailtecParser('https://realtimebjcta.availtec.com/InfoPoint')
            }
        ]
        // this.agencies = [
        //     {
        //         name: 'BJCTA',
        //         parser: new AvailtecParser('https://realtimebjcta.availtec.com/InfoPoint')
        //     },
        //     {
        //         name: 'UAB',
        //         parser: new TranslocParser(this.transloc_key, '395')
        //     }
        // ]

        // // Raleigh, NC
        // this.center = [35.7740151,-78.6449387];
        // this.agencies = [
        //     {
        //         name: 'Raleigh, NC',
        //         parser: new TranslocParser(this.transloc_key, '20')
        //     },
        //     {
        //         name: 'Chapel Hill, NC',
        //         parser: new TranslocParser(this.transloc_key, '8')
        //     },
        // ]

        // // Grand Rapids, MI
        // this.center = [42.956337, -85.7301293];
        // this.agencies = [
        //     {
        //         name: 'Grand Rapids',
        //         parser: new AvailtecParser('http://connect.ridetherapid.org/InfoPoint')
        //     },
        // ]
    }
}

export default Configuration;
