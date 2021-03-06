'use strict';
/**
 * Created by Adrian on 22-Jun-16.
 */
let geoip, geoipUltra;
module.exports = function(thorin, opt, pluginObj) {
  if(opt.autoload) {
    geoip = require('thorin-geoip-lite');
    geoipUltra = require('thorin-geoip-ultralight');
  }

  /**
   * Performs a country lookup only, using geoip-ultralight.
   * Its memory footpring is only 2MB
   * NOTE: this is synchronous.
   * */
  pluginObj.lookupCountry = (ip) => {
    if(!geoipUltra) geoipUltra = require('thorin-geoip-ultralight');
    let countryCode = geoipUltra.lookupCountry(ip);
    if(!countryCode) return null;
    return pluginObj.getCountry(countryCode);
  };

  /**
   * Performs an IP lookup, returning information about it.
   * By default, we return all the geo information.
   * Note that one can return specific information from the geo data.
   * Info TYPES:
   *  - {undefined} -> returns the object containing the data.
   *  - region -> returns the regionName or null if not available.
   *  - full -> returns countryName, region, city
   *  NOTE:
   *    because we want in the future to lower the mem footprint, we make this async.
   *    This will work with either a promise or a callback.
   *    NOTE2: this will NEVER reject the promise, NOR callback with an error, because
   *    it is designed to always function right.
   * */

  pluginObj.lookup = function LookupIP(ip, _done) {
    if(_done === false) return doLookup(ip);
    if(typeof _done === 'function') {
      return doLookup(ip, _done);
    }
    return new Promise((resolve) => {
      doLookup(ip, (e, res) => resolve(res));
    });
  }
  function doLookup(ip, done) {
    if(typeof ip !== 'string' || !ip) return done ? done(null, null) : null;
    if(!geoip) geoip = require('thorin-geoip-lite');
    const geo = geoip.lookup(ip);
    if(!geo) return done ? done(null, null) : null;
    let result = {
      code: geo.country,
      name: pluginObj.getCountryName(geo.country),
      //region: null,
      //city: null
      //region: geo.region,
      //city: geo.city,
      //lat: geo.ll[0] || null,
      //lon: geo.ll[1] || null,
      //full: ''
    };
    if(geo.ll && typeof geo.ll[0] !== 'undefined') {
      result.lat = geo.ll[0];
      result.lon = geo.ll[1];
    }
    if(geo.region && geo.region !== '') {
      let regionName = pluginObj.getRegionName(result.code, geo.region);
      if(regionName) {
        result.region = {
          code: geo.region,
          name: regionName
        };
      }
    }
    if(geo.city && geo.city !== '') {
      result.city = geo.city;
    }
    // Full text is: {City}, {Region}, {Country Name}
    let full = [];
    if(result.city) {
      full.push(result.city);
    }
    if(result.region && (!result.city || result.city !== result.region.name)) {
      full.push(result.region.name);
    }
    full.push(result.name);
    result.full = full.join(', ');
    return done ? done(null, result) : result;
  }

}