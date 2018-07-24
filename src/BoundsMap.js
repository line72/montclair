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

        let viewport = {center: this.leafletElement.getCenter(),
                        zoom: this.leafletElement.getZoom()};

        if (this.props.onBoundsChanged) {
            this.props.onBoundsChanged(this.leafletElement.getBounds());
        }
        if (this.props.onViewportDidChange) {
            this.props.onViewportDidChange(viewport);
        }
    }
}

export default BoundsMap;
