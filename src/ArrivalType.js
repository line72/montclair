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

import moment from 'moment';

class ArrivalType {
    constructor({route, direction, arrival, vehicleId, tripId}) {
        this.route = route;
        this.direction = direction;
        this.arrival = moment(arrival);
        this.vehicleId = vehicleId;
        this.tripId = tripId;
    }
}

export default ArrivalType;
