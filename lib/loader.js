'use strict';
const fs = require('fs'),
  path = require('path');
/**
 * Created by Adrian on 22-Jun-16.
 */
module.exports = function(thorin, opt, pluginObj, done) {
  const async = thorin.util.async,
    logger = thorin.logger(opt.logger);
  let CONTINENTS = {},
    COUNTRIES = {},
    COUNTRIES_ISO3 = {},
    REGIONS = {},
    calls = [];

  // Continents
  calls.push((fn) => {
    doRead('continents.json', (e, d) => {
      if (e) return fn(e);
      CONTINENTS = d;
      fn();
    });
  });
  // Countries
  calls.push((fn) => {
    doRead('countries.json', (e, d) => {
      if (e) return fn(e);
      COUNTRIES = d;
      fn();
    });
  });
  calls.push((fn) => {
    doRead('countries_iso3.json', (e, d) => {
      if (e) return fn(e);
      COUNTRIES_ISO3 = d;
      fn();
    });
  });

  // Read regions
  calls.push((fn) => {
    if(!opt.regional) return fn();
    doRead('regions.json', (e, d) => {
      if (e) return fn(e);
      REGIONS = d;
      fn();
    });
  });

  async.series(calls, (e) => {
    if (e) return done(e);
    done(null, {
      COUNTRIES,
      COUNTRIES_ISO3,
      REGIONS,
      CONTINENTS
    });
  });


  function doRead(file, fn) {
    fs.readFile(path.normalize(__dirname + '/../data/' + file), {encoding: 'utf8'}, (err, data) => {
      if (err) {
        logger.warn(`Could not load data file: ${file}`, err);
        return fn(err);
      }
      let d;
      try {
        d = JSON.parse(data);
      } catch (e) {
        logger.warn(`Could not parse data file: ${file}`, e);
        return fn(e);
      }
      fn(null, d);
    });
  }
}

