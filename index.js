'use strict';
/**
 * Created by Adrian on 19-Mar-16.
 */
const geoIntent = require('./lib/geoIntent.js'),
  initLookup = require('./lib/lookup.js'),
  loadRegional = require('./lib/loader.js');

let geoip, geoipUltra;

let COUNTRIES = {}, COUNTRIES_ISO3 = {}, REGIONS = {}, CONTINENTS = {};

/*
* NOTE:
* We will lazy load geoip-light and autoload geoip-ultralight.
* So that at the FIRST lookup() function, we'll load the ip db in memory.
* */
module.exports = function (thorin, opt, pluginName) {
  opt = thorin.util.extend({
    logger: pluginName || 'geo',
    regional: true,         // should we load the regional information that gives us countries and region lookup
    autoload: false
  }, opt);
  const logger = thorin.logger(opt.logger),
    pluginObj = {};

  // Attach our functionality to the intent.
  geoIntent(thorin, opt, pluginObj);
  // Attach our IP lookup
  initLookup(thorin, opt, pluginObj);


  /**
  * A few country-specific getters, works with ISO2 and ISO3 codes
  * */
  pluginObj.getCountries = (code) => {
    let res = [];
    let items = Object.keys(COUNTRIES);
    for(let i=0, len = items.length; i < len; i++) {
      res.push({
        code: items[i],
        name: COUNTRIES[items[i]].name
      });
    }
    return res;
  };
  pluginObj.getCountry = (code) => {
    return getCountry(code) || null;
  }
  pluginObj.getCountryName = (code) => {
    let country = getCountry(code);
    if(!country) return null;
    return country.name;
  }
  pluginObj.getCountryTel = (code) => {
    let country = getCountry(code);
    if(!country) return null;
    let tels = country.tel;
    if(!tels || tels === '') return null;
    tels = tels.split(',');
    for(let i=0; i < tels.length; i++) {
      tels[i] = parseInt(tels[i]);
    }
    if(tels.length === 0) return null;
    return tels;
  }
  pluginObj.getCountryContinent = (code) => {
    let country = getCountry(code);
    if(!country) return null;
    return CONTINENTS[country.continent] || null;
  }
  pluginObj.getCountryRegions = (code) => {
    let res = [],
      country = getCountry(code);
    if(!country) return res;
    let tmp = REGIONS[country.code];
    if(!tmp || tmp.length === 0) return res;
    let items = Object.keys(tmp);
    for(let i=0, len = items.length; i < len; i++) {
      res.push({
        code: items[i],
        name: tmp[items[i]]
      });
    }
    res.sort((a, b) => {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });
    return res;
  };


  /**
   * Returns the region name based on its countryCode and regionCode.
   * */
  pluginObj.getRegionName = (countryCode, regionCode) => {
    let country = getCountry(countryCode);
    if(!country) return null;
    let tmp = REGIONS[country.code];
    if(!tmp) return null;
    regionCode = regionCode.toString().toUpperCase();
    return tmp[regionCode] || null;
  }

  // If we want regional support, attach it
  pluginObj.run = function (done) {
    if(!opt.regional) return done();
    loadRegional(thorin, opt, pluginObj, (e, d) => {
      if(e) return done(e);
      COUNTRIES = d.COUNTRIES;
      COUNTRIES_ISO3 = d.COUNTRIES_ISO3;
      REGIONS = d.REGIONS;
      CONTINENTS = d.CONTINENTS;
      done();
    });
  }


  return pluginObj;
};
module.exports.publicName = 'geo';

/* Private and utility functions */
function getCountry(code) {
  if(typeof code !== 'string' || !code) return null;
  code = code.toUpperCase();
  if(code.length > 2) {
    code = COUNTRIES_ISO3[code];
  }
  if(!code) return null;
  return COUNTRIES[code];
}