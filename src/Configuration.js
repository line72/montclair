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
import RouteShoutParser from './RouteShoutParser';

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

        // // Steamboat Sprints, CO
        // this.center = [40.469178, -106.823354];
        // this.agencies = [
        //     {
        //         name: 'Steamboat Springs',
        //         parser: new RouteShoutParser('', '',
        //                                      'https://steamboatspringstransit.routematch.com/',
        //                                      [
        //                                          [1, 'Blue', 'Blue Line', '2F54E8'],
        //                                          [2, 'Green', 'Green Line', '53EB05'],
        //                                          [3, 'Night Condos', 'Night Line Condos 19%2F20', 'FC75E5'],
        //                                          [4, 'Night Winter', 'Night Line Summer', 'F00089'],
        //                                          [5, 'Orange', 'Orange Line', 'ED7D31'],
        //                                          [6, 'Purple', 'Purple Line', '8000F6'],
        //                                          [7, 'Red', 'Red Line', 'FF0000'],
        //                                          [8, 'Regional', 'Regional Shuttle', 'C55A00'],
        //                                          [9, 'Yellow CMC', 'Yellow Line to CMC', 'FFFF00'],
        //                                          [10, 'Yellow Hilltop', 'Yellow Hilltop', 'FFFF00'],
        //                                          [11, 'Yellow On-Call', 'Yellow On-Call 2019', 'FEE543']
        //                                      ]
        //                                     )
        //     }
        // ];
    }
}

export default Configuration;
