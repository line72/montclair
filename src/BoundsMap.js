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

import { Map } from 'react-leaflet';

/**
 * Simple extension of the Map object to
 *  get back a bounds object whenever the
 *  viewport changes.
 */
class BoundsMap extends Map {
    componentDidMount() {
        super.componentDidMount();

        if (this.props.onBoundsChanged) {
            this.props.onBoundsChanged(this.leafletElement.getBounds());
        }
    }

    onViewportChanged = () => {
        //super.onViewportChanged();

        if (this.props.onBoundsChanged) {
            this.props.onBoundsChanged(this.leafletElement.getBounds());
        }
    }
}

export default BoundsMap;
