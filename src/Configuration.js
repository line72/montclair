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

class Configuration {
    constructor() {
        // Birmingham, AL (BJCTA)
        this.base_url = 'https://realtimebjcta.availtec.com/InfoPoint';
        this.center = [33.5084801, -86.8006611];

        // Arkon, OH
        //this.base_url = 'https://realtimemetro.availtec.com/InfoPoint';

        // Grand Rapids, MI
        //this.base_url = 'http://connect.ridetherapid.org/InfoPoint';
        //this.center = [42.956337, -85.7301293];
    }
}

export default Configuration;
