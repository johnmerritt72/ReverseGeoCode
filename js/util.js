/**
 * Helper functions for the Geocoder tool.
 */

/**
 * Fill a SELECT element with options for all ISO-3166 country codes,
 * plus an empty value.
 * @param {string} elementId ID for a DOM object to add the SELECT to.
 */
var fillCountrySelect = function(elementId) {
    var element = document.getElementById(elementId);
    var select = document.createElement('option');
    select.setAttribute('value', '');
    var text = document.createTextNode('(none)');
    select.appendChild(text);
    element.appendChild(select);

    for (var cc in ISO3166_COUNTRY_CODE) {
        var select = document.createElement('option');
        select.setAttribute('value', cc);
        select.setAttribute('title', ISO3166_COUNTRY_CODE[cc]);
        var text = document.createTextNode(
            ISO3166_COUNTRY_CODE[cc].substr(0, 16) +
            (ISO3166_COUNTRY_CODE[cc].length > 16 ? '...' : '') + ' (' + cc + ')');
        select.appendChild(text);
        element.appendChild(select);
    }
};

/**
 * The SearchControl implements a control that takes user input.
 * @unrestricted
 */
class SearchControl {
    /**
     * @param {Object} controlDiv The control DIV.
     */
    constructor(controlDiv) {
        controlDiv.className = 'control-ui';
        controlDiv.appendChild(document.getElementById('search-control-ui'));
    }
}

/**
 * The ResultsControl implements a control that displays geocoding results.
 * @unrestricted
 */
class ResultsControl {
    /**
     * @param {Object} controlDiv The control DIV.
     */
    constructor(controlDiv) {
        controlDiv.className = 'control-ui';
        controlDiv.appendChild(document.getElementById('results-control-ui'));
    }
}

/**
 * Make an element visible.
 * @param {Object} element A DOM object to make visible.
 */
var displayElement = function(element) {
    element.className = 'visible';
};

/**
 * Make an element visible, but display: inline.
 * @param {Object} element A DOM object to make visible.
 */
var displayElementInline = function(element) {
    element.className = 'visible-inline';
};

/**
 * Make an element invisible and take no space.
 * @param {Object} element A DOM object to make invisible.
 */
var hideElement = function(element) {
    element.className = 'hidden';
};

/**
 * Clear an element by removing all its content..
 * @param {Object} element A DOM object to make invisible.
 */
var clearElement = function(element) {
    element.innerHTML = '';
};

/**
 * Find the first primary address component.
 * @param {Array} types List of strings representing address component types.
 * @return {string} The primary address component (if found, empty otherwise).
 */
var findPrimaryType = function(types) {
    for (var i = 0, type; type = PRIMARY_ADDRESS_COMPONENT_TYPES[i]; i++) {
        if (types.indexOf(type) != -1) {
            return type;
        }
    }
    return '';
};

/**
 * Parse a LatLng value from a string.
 * @param {string} value A string that may contain a LatLng.
 * @return {google.maps.LatLng} The latlng parsed from the input string.
 */
var parseLatLng = function(value) {
    // Attempt to parse a latlng in this string.
    var split = value.split(',');
    if (split.length == 2) {
        // Remove whitespaces from start and end, but nowhere else.
        // Use Number() instead of parseFloat() to parse strictly only numbers.
        // These avoid things like "7 High St, 2GB UK" => (7,2)
        var lat = +split[0];
        var lng = +split[1];
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return new google.maps.LatLng(lat, lng);
        }
    }
    return null;
};

/**
 * Parse a place ID value from a string.
 * @param {string} value A string that may contain a place ID.
 * @return {string} The place ID parsed from the input string.
 */
var parsePlaceId = function(value) {
    // Place IDs are web-safe strings, so they match [a-zA-Z0-9_-]+
    // To distinguish them from valid, one-word geographical names, we check for
    // - Short place IDs always start with "ChIJ" or "GhIJ" and have exactly 27
    // characters.
    // - Long place ID always start with "E" or "I" and have at more than 30
    // characters.
    if (!value.match(/^[a-zA-Z0-9_-]+$/)) {
        return null;
    }
    if ((value.length > 30) && (value[0] == 'E' || value[0] == 'I')) {
        return value;
    }
    if ((value.length = 27) &&
        (value.substring(0, 4) == 'ChIJ' || value.substring(0, 4) == 'GhIJ')) {
        return value;
    }
    return null;
};

/**
 * Build a param=value pair for use in the URL hash fragment.
 * @param {Object} obj The object to convert (to string).
 * @param {string} param The URL parameter name.
 * @param {Object} value Alternative string to use instead of obj.
 * @return {string} The desired param=value string.
 */
var objectToParam = function(obj, param, value) {
    if (obj) {
        if (typeof value == 'undefined') {
            value = obj;
        }
        return '&' + param + '=' + value;
    } else {
        return '';
    }
};

/**
 * Return the full URL for a lettered marker from Google Maps.
 * @param {number} i A natural number (index) to convert to a lettered marker.
 *   There are only so many lettered markers, so if we run out of letter we'll
 *   cycle through them.
 * @return {string} URL to a lettered marker.
 */
var letteredMarkerFromIndex = function(i) {
    var letter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
    return LETTERED_ICON_BASENAME + letter + '.png';
};

/**
 * Put the focus on the query input.
 */
var focusOnQueryInput = function() {
    var input = document.getElementById('query-input');
    if (input) {
        input.focus();
    }
};