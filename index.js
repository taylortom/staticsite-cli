#! /usr/bin/env node
var async = require("async");
var chalk = require("chalk");
var fs = require("fs");
var minimist = require("minimist");
var path = require("path");

var args = minimist(process.argv.slice(2));
// set this globally so that config initialises properly
if(args.dir) {
  if(!fs.existsSync(args.dir)) {
    console.log(`Source dir doesn't exist: '${args.dir}'`);
    process.exit(1);
  }
  process.env.SITE_SRC = args.dir;
}
var config = require("./js/config");
var logger = require("./js/logger");

// self-starter
(function start() {
  welcome();
  processCommand();
})();

function processCommand() {
  var command = args._[0];

  if(command === "list" || args.h || args.help) {
    listCommands(process.exit);
    return;
  }

  try {
    var commandHandler = require(path.join(config._CLI_ROOT, "bin", command));
  } catch(e) {
    return logger.error(`'${command}' is not a valid command. See '${Object.keys(config.bin)[0]} list' for help.`);
  }

  logger.command("Running " + command);
  commandHandler(args, function finishedCommand(error, data) {
    if(error) logger.error(error);
    else logger.done("Finished " + command);
    // make sure we close properly
    process.exit();
  });
}

function welcome() {
  console.log(config.name + ": " + config.description + " (v" + config.version + ")");
}

function listCommands(callback) {
  var columnify = require('columnify');
  console.log("\nThe available commands are:\n");

  var nameRE = /@name (.+)/;
  var descRE = /@description (.+)/;
  var argsRE = /@args (.+)/;
  var commands = {};

  var longestName = 0;

  fs.readdir(path.join(config._CLI_ROOT, "bin"), function onRead(error, files) {
    if(error) return logger.error(error)

    async.each(files, function loop(file, doneLoop) {
      fs.readFile(path.join(config._CLI_ROOT, "bin", file), { encoding: "utf8" }, function onFileRead(error, contents) {
        if(error) return doneLoop(error);

        var name = contents.match(nameRE);
        var description = contents.match(descRE);
        var argsDescription = contents.match(argsRE);

        if(!name || !description) {
          logger.warn('No task info found for ' + file);
          return doneLoop();
        }
        if(name[1].length > longestName) longestName = name[1].length;

        commands[chalk.gray(name[1])] = `${description[1]} ${args[1] && chalk.blue(args[1]) || ''}`;
        doneLoop();
      });
    }, function doneAll(error) {
      if(error) logger.error(error);

      console.log(columnify(commands, {
        maxWidth: 75-longestName,
        showHeaders: false,
        columnSplitter: '  '
      }) + '\n');
      console.log(`${chalk.underline('TIP:')} to use src files other than those set in package.json, pass the path using ${chalk.blue('--dir')}\n`);
      callback();
    });
  });
}
