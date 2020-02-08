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

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

/**
 * Parser for the GTFS-RT Trip Updates
 *
 * https://developers.google.com/transit/gtfs-realtime/guides/trip-updates
 */
class RTTripParser {
    constructor(url) {
        this.url = url;
    }

    /**
     * Get the latest trip updates
     *  and return the vehicle estimates
     *  for the stop of interest
     *
     * @param stopId -> [StopId]
     * @return Promise -> map(StopId,[Vehicles])
     */
    update(stopId) {
        return fetch(this.url, {responseType: 'arraybuffer'}).then((resp) => {
            return resp.arrayBuffer();
        })
            .then((ab) => {
                let msg = new Uint8Array(ab);
                let feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(msg);
                let stopInfo = feed.entity.reduce((acc, entity) => {
                    if (entity.tripUpdate) {
                        let stopTime = entity.tripUpdate.stopTimeUpdate.find((s) => {
                            return s.stopId === stopId;
                        });

                        if (stopTime) {
                            let stopId = stopTime.stopId;

                            let calcArrival = (s) => {
                                if (s.departure && s.departure.time) {
                                    return s.departure.time;
                                } else {
                                    return s.arrival.time;
                                }
                            };

                            let arrival = calcArrival(stopTime);
                            let tripId = entity.tripUpdate.trip.tripId;
                            let routeId = entity.tripUpdate.trip.routeId;
                            let vehicleId = entity.tripUpdate.vehicle.id;

                            if (!(stopId in acc)) {
                                acc[stopId] = [];
                            }
                            acc[stopId].push({
                                routeId: routeId,
                                tripId: tripId,
                                vehicleId: vehicleId,
                                arrival: arrival
                            });
                        }
                    }
                    return acc;
                }, {});

                return stopInfo;
            });
    }
}

export default RTTripParser;
