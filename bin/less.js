import fs from 'fs-extra';
import cleanCss from 'less-plugin-clean-css';
import config from '../js/config.js';
import path from 'path';
import less from 'less';

/*
* @name less
* @description Compiles the less to the output folder
*/
export default function(args, cbCompiled) {
  fs.readFile(path.join(config._LESS_DIR,config.theme.main), "utf-8", function onRead(error, file) {
    if(error) {
      return cbCompiled(error);
    }
    var options = config.theme.options;
    options.paths = [ config._LESS_DIR ];

    if(options.compress === true) {
      if(!options.plugins) options.plugins = [];
      options.plugins.push(new cleanCss({ advanced: true }));
    }
    less.render(file, options, function (error, output) {
      if(error) {
        error.message = `Failed to render LESS. ${error.message} (at ${error.filename})`;
        return cbCompiled(error);
      }
      fs.outputFile(path.join(config._OUTPUT_DIR, 'css', "theme.css"), output.css, cbCompiled);
    });
  });
};
