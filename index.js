#! /usr/bin/env node
import chalk from 'chalk';
import config from './js/config.js';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import logger from './js/logger.js';
import minimist from 'minimist';
import path from 'path';
import { pathToFileURL } from 'url';

var args = minimist(process.argv.slice(2));
// set this globally so that config initialises properly
if(args.dir) {
  if(!existsSync(args.dir)) {
    console.log(`Source dir doesn't exist: '${args.dir}'`);
    process.exit(1);
  }
  process.env.SITE_SRC = args.dir;
}
// self-starter
(function start() {
  config.initialise();
  logger.initialise();
  welcome();
  processCommand();
})();

async function processCommand() {
  var command = args._[0];

  if(command === "list" || args.h || args.help) {
    await listCommands();
    process.exit();
    return;
  }

  try {
    var { default: commandHandler } = await import(pathToFileURL(path.join(config._CLI_ROOT, "bin", `${command}.js`)));
  } catch(e) {
    if(e.code === 'ENOENT') return logger.error(`'${command}' is not a valid command. See '${Object.keys(config.bin)[0]} list' for help.`);
    logger.error(`Failed to load command '${command}'`);
    console.trace(e);
  }

  logger.command("Running " + command);

  try {
    await commandHandler(args);
    logger.done("Finished " + command);
  } catch(error) {
    logger.error(error);
  }
  process.exit();
}

function welcome() {
  console.log(config.name + ": " + config.description + " (v" + config.version + ")");
}

async function listCommands() {
  var nameRE = /@name (.+)/;
  var descRE = /@description (.+)/;
  var argsRE = /@args (.+)/;

  const files = await fs.readdir(path.join(config._CLI_ROOT, "bin"));
  var commands = [];
  var longestName = 0;

  for (const file of files) {
    const contents = await fs.readFile(path.join(config._CLI_ROOT, "bin", file), 'utf-8');
    var name = contents.match(nameRE);
    var description = contents.match(descRE);
    var argsDescription = contents.match(argsRE);

    if(!name || !description) {
      logger.warn('No task info found for ' + file);
      continue;
    }
    if(name[1].length > longestName) longestName = name[1].length;
    commands.push({ name: name[1], description: description[1], args: argsDescription?.[1] });
  }

  console.log("\nThe available commands are:\n");
  for (const cmd of commands) {
    const paddedName = chalk.gray(cmd.name.padEnd(longestName + 2));
    const desc = cmd.args ? `${cmd.description} ${chalk.blue(cmd.args)}` : cmd.description;
    console.log(`${paddedName}${desc}`);
  }
  console.log();
  console.log(`${chalk.underline('TIP:')} to use src files other than those set in package.json, pass the path using ${chalk.blue('--dir')}\n`);
}
