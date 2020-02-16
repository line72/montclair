# Montclair

Montclair is a Web Application built on React for tracking public
transportation vehicles in real time. It supports fetching all the
routes, vehicle locations, stops, and showing the estimated arrival
times.

Montclair was initially built to support Birmingham, Alabama's Bus
system, but has since been extended to support many different
agencies.

Montclair is a client side only application, and it requires pulling
vehicle data from a 3rd party integration. Currently, there is support
for the following integration vendors:

- [Availtec](https://availtec.com/)
- [Transloc](https://transloc.com/) (Both mashape/rapidapi and raw transloc 3 API)
- [RouteShout](http://www.routeshout.com/) 2.0 API
- [GTFS](https://developers.google.com/transit/gtfs/) and
  [GTFS-rt](https://developers.google.com/transit/gtfs-realtime/) data

This is the core application being used as part of the ["Go Transit
App"](https://gotransitapp.com) collection, where white labeled apps for different cities have
been created. You can see an example of this with ["Go Birmingham"](https://birmingham.gotransitapp.com).

## Running Montclair

1. Clone the repository
1. Run `npm install`
1. Configure the application. You will need to modify the
   src/Configuration.js to specify which integration(s) you want along
   with their sources. See each of the src/*Parser.js files to find their configuration options.
1. Run `npm start` to start a local server

## Copyright

Copyright (c) 2020 Marcus Dillavou <line72@line72.net>

## License

Montclair is released under the GPLv3. See the COPYING file for more
information.
