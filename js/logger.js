var chalk = require("chalk");
var config = require("./config");
var pkg = require("../package.json");

/*
* Various debugging shortcuts
*/
var exports = module.exports = {};

exports.welcome = function() {
    console.log(pkg.name + ": " + pkg.description + " (v" + pkg.version + ")");
};

exports.listCommands = function() {
    var commands = {
        "init   ": "Downloads the repos and readies the file system",
        "test   ": "For offline testing: builds files, and calls serve",
        "post   ": "Creates an empty post file and opens in editor",
        "serve  ": "Runs local server and opens in browser",
        "launch ": "Opens the published site in browser",
        "publish": "Builds files, updates git, and uploads to FTP server",
    };
    console.log();
    console.log("Available commands:");
    console.log();
    for(var key in commands) {
        console.log(chalk.blue(key) + "  " + commands[key]);
    }
};

// consoles
exports.command = function(message) { console.log(">> " + message); };
exports.task    = function(message) { console.log(chalk.underline(message)); }
exports.done    = function(message) { console.log(">> " + chalk.green(message)); }
exports.log     = function(message) { console.log(message); };
exports.info    = function(message) { console.log(chalk.gray("** " + message + " **")); };
exports.debug   = function(message) { if(config.debug) console.log("   " + message); };
exports.warn    = function(message) { console.log("!! " + chalk.yellow(message)); };
exports.error   = function(message) { console.log("!! " + chalk.red(message)); };

// string styling
exports.file    = function(value) { return chalk.magenta(value); };
exports.var     = function(value) { return '"' + value + '"'; };
