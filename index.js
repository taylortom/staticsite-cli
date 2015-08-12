#! /usr/bin/env node
var _ = require("underscore");
var fs = require("fs");
var log = require("./js/logger");
var path = require("path");

var config = require("./js/config.js");

// self-starter
(function start() {
    initTempVars();
    processCommand();
})();

function initTempVars() {
    config._CLI_ROOT = path.dirname(require.main.filename);
    config._TEMP_DIR = path.join(config._CLI_ROOT, "tmp");
    config._OUTPUT_DIR = path.join(config._TEMP_DIR, "site");
    config._PAGES_DIR = path.join(config._TEMP_DIR, "pages");
    config._POSTS_DIR = path.join(config._TEMP_DIR, "posts");
    config._TEMPLATES_DIR = path.join(config._TEMP_DIR, "templates");
};

function processCommand() {
    var command = process.argv[2];
    var commandDir = path.join(config._CLI_ROOT, "bin", command + ".js");

    fs.stat(commandDir, function(error, results) {
        if(error) return log(new Error("invalid command '" + command + "'"));

        var options = getArguments();
        var commandHandler = require(commandDir)(options);
    });
}

function getArguments() {
    return _.filter(process.argv.slice(3), isValidOption);
};

function isValidOption(argument) {
    if(argument.indexOf("--") === 0) return true;

    log("Warning, failed to parse option: '" + argument + "'");
    return false;
};
