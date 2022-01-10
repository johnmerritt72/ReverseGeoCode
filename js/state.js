/**
 * @fileoverview This file contains the code for the IdGenerator.
 */

/**
 * An object that stores the overall state of the geocoder tool.
 * @unrestricted
 */
class GeocoderState {
    constructor() {
        this.bounds = null;
        this.center = null;
        this.componentRestrictions = {
            administrativeArea: '',
            country: '',
            locality: '',
            postalCode: '',
            route: ''
        };
        this.country = '';
        this.query = '';
        this.placeId = '';
        this.result_type = '';
        this.location_type = '';
        this.showResultList = true;
        this.showSearchOptions = false;
        this.viewportBias = false;
        this.zoom = 3;

        GeocoderState.prototype.reset = function() {
            this.bounds = null;
            this.center = null;
            this.componentRestrictions = {
                country: '',
                administrativeArea: '',
                locality: '',
                postalCode: '',
                route: ''
            };
            this.country = '';
            this.query = '';
            this.placeId = '';
            this.location_type = document.getElementById('restrict-location-type').value;
            this.result_type = document.getElementById('restrict-result-type').value;
            this.showResultList = true;
            this.showSearchOptions = false;
            this.viewportBias = false;
            this.zoom = 3;
        };

        /**
         * Center (and zoom) the map following the global state.
         * @param {google.maps.Map} map The map to center.
         */
        GeocoderState.prototype.centerMap = function(map) {
            if (map) {
                map.setCenter(this.center);
                map.setZoom(this.zoom);
            }
        };

        /**
         * Update the global state from the URL hash fragment.
         * @param {string} hash The hash fragment to parse.
         */
        GeocoderState.prototype.updateFromHash = function(hash) {
            this.reset();

            var argv = hash.split('&');
            var argc = argv.length;
            for (var i = 0; i < argc; i++) {
                var param = argv[i].split('=');
                switch (param[0]) {
                    case 'place_id':
                        // Nothing else matters when we have a place ID.
                        this.reset();
                        this.placeId = unescape(param[1]);
                        return;
                    case 'q':
                        this.query = unescape(param[1]);
                        break;
                    case 'country':
                        this.country = unescape(param[1]);
                        break;
                    case 'bounds':
                        values = unescape(param[1]).split(',');
                        this.viewportBias = true;
                        this.bounds = new google.maps.LatLngBounds(
                            new google.maps.LatLng(values[0], values[1]),
                            new google.maps.LatLng(values[2], values[3]));
                        break;
                    case 'result_type':
                        this.result_type = unescape(param[1]);
                        break;
                    case 'location_type':
                        this.location_type = unescape(param[1]);
                        break;
                    case 'in_country':
                        this.componentRestrictions.country = unescape(param[1]);
                        break;
                    case 'in_administrative_area':
                        this.componentRestrictions.administrativeArea = unescape(param[1]);
                        break;
                    case 'in_locality':
                        this.componentRestrictions.locality = unescape(param[1]);
                        break;
                    case 'in_postal_code':
                        this.componentRestrictions.postalCode = unescape(param[1]);
                        break;
                    case 'in_route':
                        this.componentRestrictions.route = unescape(param[1]);
                        break;
                }
            }
        };

        /**
         * Update the URL hash fragment from the global state.
         * @return {string} The hash fragment that represents the state.
         */
        GeocoderState.prototype.buildHash = function(bounds) {
            if (this.placeId) {
                // Nothing else matters when we have a place ID.
                return 'place_id=' + escape(this.placeId);
            }
            var hash = 'q=' + escape(this.query);
            hash += objectToParam(this.showSearchOptions, 'options', 'true');
            hash += objectToParam(this.country, 'country');
            if (this.viewportBias) {
                var bounds_value =
                    (bounds.getSouthWest().toUrlValue(6) + ',' +
                        bounds.getNorthEast().toUrlValue(6));
                hash += objectToParam(this.bounds, 'bounds', bounds_value);
            }
            hash += objectToParam(escape(this.result_type), 'result_type');
            hash += objectToParam(escape(this.location_type), 'location_type');
            hash += objectToParam(this.componentRestrictions.country, 'in_country');
            hash += objectToParam(escape(this.componentRestrictions.administrativeArea), 'in_administrative_area');
            hash += objectToParam(escape(this.componentRestrictions.locality), 'in_locality');
            hash += objectToParam(escape(this.componentRestrictions.postalCode), 'in_postal_code');
            hash += objectToParam(escape(this.componentRestrictions.route), 'in_route');
            return hash;
        };

        /**
         * Build a geocoding request from the global state.
         *
         * @return {Object} A geocoding request suitable to be fed to the
         *   google.maps.Geocoder.geocode() method as per
         *   http://developers.google.com/maps/documentation/javascript/geocoding#GeocodingRequests
         */
        GeocoderState.prototype.buildGeocodingRequest = function() {
            // Build the geocoding request from state.
            var request = {};

            if (this.placeId) {
                // Nothing else matters when we have a place ID.
                request.placeId = this.placeId;
                return request;
            }

            // Attempt to parse a LatLng from the input query.
            if (this.query) {
                var latlng = parseLatLng(this.query);
                if (latlng) {
                    request.latLng = latlng;
                    // Ensure the state has mothing more than just this latlng.
                    //this.reset();
                    this.query = latlng.toUrlValue(6);
                }

                var placeId = parsePlaceId(this.query);
                if (placeId) {
                    request.placeId = placeId;
                    // Ensure the state has mothing more than just this place ID.
                    this.reset();
                    this.placeId = placeId;
                    return request;
                }

                // Failing that, assume it's an address. An empty query is acceptable
                // when componentRestrictions is not empty.
                if (!request.latLng) {
                    request.address = this.query;
                }

                // Add region and viewport biasing if we're geocoding a non-empty
                // address.
                if (request.address) {
                    request.address = this.query;
                    if (this.country) {
                        request.region = this.country;
                    }
                    if (this.viewportBias) {
                        request.bounds = this.bounds;
                    }
                }
            }
            if (this.result_type) {
                request.result_type = this.result_type;
            }
            if (this.location_type) {
                request.location_type = this.location_type;
            }

            // Fill in componentRestrictions, in the order a user would normally
            // write.
            var componentRestrictions = {};
            // if (this.componentRestrictions.route) {
            //     componentRestrictions.route = this.componentRestrictions.route;
            // }
            // if (this.componentRestrictions.locality) {
            //     componentRestrictions.locality = this.componentRestrictions.locality;
            // }
            // if (this.componentRestrictions.postalCode) {
            //     componentRestrictions.postalCode =
            //         this.componentRestrictions.postalCode;
            // }
            // if (this.componentRestrictions.administrativeArea) {
            //     componentRestrictions.administrativeArea =
            //         this.componentRestrictions.administrativeArea;
            // }
            // if (this.componentRestrictions.country) {
            //     componentRestrictions.country = this.componentRestrictions.country;
            // }

            if (componentRestrictions.country ||
                componentRestrictions.administrativeArea ||
                componentRestrictions.locality || componentRestrictions.postalCode ||
                componentRestrictions.route) {
                request.componentRestrictions = componentRestrictions;
            }

            return request;
        };
    }

    /**
     * Build a link to the Geocoding API web service to geocode the global state.
     * This is handy for grabbing the raw JSON/XML geocoding response.
     * @param {string} format An output format supported by the Geocoding API at
     *   https://developers.google.com/maps/documentation/geocoding/overview#GeocodingRequests
     * @return {string} A request to the Geocoding API. Requires replacing
     *   YOUR_API_KEY placeholder with a valid API key.
     */
    buildLinkToWebService(format) {
        let url = 'https://maps.googleapis.com/maps/api/geocode/' + format + '?';
        url += 'key=AIzaSyB-GodxsXZrkplcgERRRXuIyWeyDFIZbRM';
        var request = this.buildGeocodingRequest();
        if (request.placeId) {
            url += '&place_id=' + request.placeId;
            return url;
        }
        if (request.latLng) {
            url += '&latlng=' + request.latLng.toUrlValue(6);
        } else if (request.address) {
            url += '&address=' + encodeURIComponent(request.address);
            if (request.region) {
                url += '&region=' + request.region;
            }
            if (request.bounds) {
                url += '&bounds=' + request.bounds.getSouthWest().toUrlValue(6) + '|' +
                    request.bounds.getNorthEast().toUrlValue(6);
            }
        }
        if (request.result_type) {
            url += '&result_type=' + encodeURIComponent(request.result_type);
        }
        if (request.location_type) {
            url += '&location_type=' + encodeURIComponent(request.location_type);
        }
        if (request.componentRestrictions) {
            url += '&components=';
            components = [];
            if (request.componentRestrictions.country) {
                components.push(
                    'country:' +
                    encodeURIComponent(request.componentRestrictions.country));
            }
            if (request.componentRestrictions.administrativeArea) {
                components.push(
                    'administrative_area:' +
                    encodeURIComponent(
                        request.componentRestrictions.administrativeArea));
            }
            if (request.componentRestrictions.locality) {
                components.push(
                    'locality:' +
                    encodeURIComponent(request.componentRestrictions.locality));
            }
            if (request.componentRestrictions.postalCode) {
                components.push(
                    'postal_code:' +
                    encodeURIComponent(request.componentRestrictions.postalCode));
            }
            if (request.componentRestrictions.route) {
                components.push(
                    'route:' + encodeURIComponent(request.componentRestrictions.route));
            }
            url += components.join('|');
        }
        return url;
    }
}