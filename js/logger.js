var chalk = require("chalk");
var conf = require("./config").logging;

/*
* Various debugging shortcuts
*/
var exports = module.exports = {};

// string styling
exports.file    = function(value) { return chalk.magenta(value); };
exports.var     = function(value) { return '"' + value + '"'; };

/*
* Sets up logging functions based on config data (e.g. exports.command = (below code))
* If type of log isn't incl. in filter function will do nothing.
* [this] set to  config data.
*/
// self-starter
(function init() {
    var logLevel = conf.filter;
    var filter = conf.logFilters[logLevel] || conf.logFilters.normal;
    for(var key in conf.logTypes) {
        var enabled = filter.indexOf(key) !== -1;
        exports[key] = (function(message) {
            var prefix = (this.prefix && this.prefix + " ") || "";
            var message = chalk[this.style] && chalk[this.style](message) || message;
            var suffix = (this.suffix && " " + this.suffix) || "";
            console.log(prefix + message + suffix);
        }).bind(conf.logTypes[key]);
    };

    if(!conf.logFilters[logLevel]) exports.warn("debugging level '" + logLevel + "' not recognised, switching to 'normal'");
    else exports.info("debugging level set to '" + logLevel + "'");
})();
