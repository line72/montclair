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

class StopOverlayType {
    constructor({agency, stop, id, name, arrivals, fetching, visible}) {
        this.agency = agency;
        this.stop = stop;
        this.id = id;
        this.name = name || "";
        this.arrivals = arrivals || [];
        this.fetching = !!fetching;
        this.visible = !!visible;
    }
}

export default StopOverlayType;
