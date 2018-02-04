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

class VehicleType {
    constructor({id, position, direction = '', heading,
                 destination, on_board = 0, deviation = 0,
                 op_status = '', color, route_id}) {

        this.id = id;
        this.position = position;
        this.direction = direction;
        this.heading = heading;
        this.destination = destination;
        this.on_board = on_board;
        this.deviation = deviation;
        this.op_status = op_status;
        this.color = color;
        this.route_id = route_id;
    }
}

export default VehicleType;
