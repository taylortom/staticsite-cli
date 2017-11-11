var fs = require('fs-extra');
var cleanCSS = require('less-plugin-clean-css');
var LESS = require('less');
var path = require('path');

var config = require('../js/config');

/*
* @name less
* @description Compiles the less to the output folder
*/
module.exports = function less(args, cbCompiled) {
  fs.readFile(path.join(config._LESS_DIR,config.theme.main), "utf-8", function onRead(error, file) {
    if(error) {
      return cbCompiled(error);
    }
    var options = config.theme.options;
    options.paths = [ config._LESS_DIR ];

    if(options.compress === true) {
      if(!options.plugins) options.plugins = [];
      cleanCSSPlugin = new cleanCSS({ advanced: true });
      options.plugins.push(cleanCSSPlugin);
    }
    LESS.render(file, options, function (error, output) {
      if(error) {
        error.message = `Failed to render LESS. ${error.message} (at ${error.filename})`;
        return cbCompiled(error);
      }
      fs.outputFile(path.join(config._OUTPUT_DIR, 'css', "theme.css"), output.css, cbCompiled);
    });
  });
};
