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

import { withLeaflet, MapControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.locatecontrol';

class LocateControl extends MapControl {
    createLeafletElement(props) {
        return L.control.locate({position: 'bottomright'});
    }
}

export default withLeaflet(LocateControl);
