import chalk from 'chalk';
import config from './config.js';

/*
* Various debugging shortcuts
*/
var exports = {};

// string styling
exports.file = function(value) { return chalk.magenta(value); };
exports.var  = function(value) { return '"' + value + '"'; };

/*
* Sets up logging functions based on config data (e.g. exports.command = (below code))
* If type of log isn't incl. in filter function will do nothing.
* [this] set to  config data.
*/
// self-starter
(function init() {
  var logConf = config.logging;
  var logLevel = logConf.filter;
  var filter = logConf.logFilters[logLevel] || logConf.logFilters.normal;
  for(var key in logConf.logTypes) {
    if(filter[0] !== "*" && filter.indexOf(key) === -1) {
      exports[key] = function() {};
      continue;
    }
    exports[key] = (function(message) {
      var prefix = (this.prefix && this.prefix) || "";
      var message = chalk[this.style] && chalk[this.style](message) || message;
      var suffix = this.suffix || "";
      console.log(prefix + message + suffix);
    }).bind(logConf.logTypes[key]);
  }
  if(!logConf.logFilters[logLevel]) exports.warn("debugging level '" + logLevel + "' not recognised, switching to 'normal'");
})();

export default exports;