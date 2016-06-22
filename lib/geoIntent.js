'use strict';
/**
 * Extend the thorin Intent to include geo functionality
 */
module.exports = function(thorin, opt, pluginObj) {

  const Intent = thorin.Intent;

  class ThorinIntent extends Intent {

    /**
    * Attach the "geoData" to the intent, so that it can access it.
     * This is only a wrapper over the lookup() function.
    * */
    geoData(_fn) {
      return pluginObj.lookup(this.client('ip'), _fn);
    }

    /**
    * This is just a lookup over the lookupCountry() function
    * */
    geoCountry() {
      return pluginObj.lookupCountry(this.client('ip'));
    }

  }

  thorin.Intent = ThorinIntent;
};