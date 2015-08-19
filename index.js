#! /usr/bin/env node
var _ = require("underscore");
var fs = require("fs");
var logger = require("./js/logger");
var path = require("path");

var config = require("./js/config");

// self-starter
(function start() {
    logger.welcome();
    processCommand();
})();

function processCommand() {
    var command = process.argv[2];
    var commandDir = path.join(config._CLI_ROOT, "bin", command + ".js");

    fs.stat(commandDir, function(error, results) {
        if(error) {
            logger.error("Invalid command " + logger.var(command));
            logger.listCommands();
            return;
        }

        var options = getArguments();
        var commandHandler = require(commandDir)(options);
    });
}

function getArguments() {
    return _.filter(process.argv.slice(3), isValidOption);
};

function isValidOption(argument) {
    if(argument.indexOf("--") === 0) return true;

    logger.warn("Failed to parse option: '" + argument + "'");
    return false;
};
