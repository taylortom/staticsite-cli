#! /usr/bin/env node
var chalk = require("chalk");
var minimist = require("minimist");
var path = require("path");

var config = require("./js/config");
var logger = require("./js/logger");

var args = minimist(process.argv.slice(2));
var commands = {
    // core
    "init    ": "Downloads the repos and readies the file system",
    "build   ": "Creates the output for the site",
    "launch  ": "launches the live site in the default browser",
    "serve   ": "Runs site on a local server",
    "post    ": "Writes a new post",
    "upload  ": "Copies files to hosted server",
    "save    ": "Stores the latest changes on git",
    // compound
    "test    ": "For offline testing: builds files, and calls serve",
    "publish ": "Builds files, updates git, and uploads to FTP server"
};

// self-starter
(function start() {
    welcome();
    processCommand();
})();

function processCommand() {
    var command = args._[0];

    if(command === "list" || args.h || args.help) return listCommands();

    try {
        console.log(path.join(config._CLI_ROOT, "bin", command));
        var commandHandler = require(path.join(config._CLI_ROOT, "bin", command));
    } catch(e) {
        return logger.error("'" + command + "' is not a valid command. See 'tt list' for help.");
    }

    logger.command("Running " + command);
    commandHandler(args, function finishedCommand(error, data) {
        if(error) logger.error(error);
        else logger.done("Finished " + command);
    });
};

function welcome() {
    console.log(config.name + ": " + config.description + " (v" + config.version + ")");
};

function listCommands(options) {
    console.log("\nThe available commands are:");
    for(var key in commands) console.log("   " + chalk.gray(key) + "  " + commands[key]);
};
