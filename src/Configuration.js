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

class Configuration {
    constructor() {
        // Birmingham, AL
        this.center = [33.5084801, -86.8006611];

        this.agencies = [
            {
                name: 'Routes',
                parser: new AvailtecParser('https://realtimebjcta.availtec.com/InfoPoint')
            }
        ]
    }
}

export default Configuration;
