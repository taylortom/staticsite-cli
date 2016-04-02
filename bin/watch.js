var fs = require("fs");
var spawn = require('child_process').spawn;

var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name watch
* @description Watches for changes, and executes the relevant CLI command set in config.json
*/
module.exports = function watch(args) {
  var conf = config.watch;

  fs.watch(config.siteSrc, { recursive: true }, function onChanged(e, filename) {
    if(e === 'error' || !filename) return logger.error('Something went wrong', e);

    var isHidden = filename.match(/(^|\/)\.[^\/\.]/g) !== null;
    var match = filename.match(/.+\.(.+)/);

    if(isHidden || !match) return; // fail silently

    var ext = match[1].toLowerCase();
    console.log(logger.file(filename), 'changed, running', logger.var(conf[ext]));

    var proc = spawn('tt', [conf[ext]]);
    proc.stderr.on('data', function(data) { logger.error(data.toString()); });
    proc.on('close', function(data) { logger.info("Done. Watching..."); });
  });
};
