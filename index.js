#! /usr/bin/env node
var _ = require("underscore");
var fs = require("fs");
var log = require("./js/logger");
var path = require("path");

var config = require("./config/config.json");

// self-starter
(function start() {
    var command = process.argv[2];
    var commandDir = path.join(path.dirname(require.main.filename), "bin", command + ".js");

    fs.stat(commandDir, function(error, results) {
        if(error) return log(new Error("invalid command '" + command + "'"));

        var options = getArguments();
        var commandHandler = require(commandDir)(options);
    });
})();

function getArguments() {
    return _.filter(process.argv.slice(3), isValidOption);
};

function isValidOption(argument) {
    if(argument.indexOf("--") === 0) return true;

    log("Warning, failed to parse option: '" + argument + "'");
    return false;
};
