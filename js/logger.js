var chalk = require("chalk");
var config = require("./config");
var pkg = require("../package.json");

/*
* Various debugging shortcuts
*/
var exports = module.exports = {};

// consoles
exports.welcome = function()        { console.log(pkg.name + ": " + pkg.description + " (v" + pkg.version + ")"); };

exports.command = function(message) { console.log(">> " + message); };
exports.task    = function(message) { console.log(chalk.underline(message)); }
exports.done    = function(message) { console.log(">> " + chalk.green(message)); }
exports.log     = function(message) { console.log(message); };
exports.info    = function(message) { console.log(chalk.gray(message)); };
exports.debug   = function(message) { if(config.debug) console.log("   " + message); };
exports.warn    = function(message) { console.log("!! " + chalk.yellow(message)); };
exports.error   = function(message) { console.log("!! " + chalk.red(message)); };

// string styling
exports.file    = function(value) { return chalk.magenta(value); };
exports.var     = function(value) { return '"' + value + '"'; };
