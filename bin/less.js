import fs from 'fs-extra';
import cleanCss from 'less-plugin-clean-css';
import config from '../js/config.js';
import path from 'path';
import less from 'less';

/*
* @name less
* @description Compiles the less to the output folder
*/
export default async function(args) {
  const file = await fs.readFile(path.join(config._LESS_DIR,config.theme.main), "utf-8");
  const options = Object.assign({ paths: [config._LESS_DIR] }, config.theme.options);
  if(options.compress === true) {
    if(!options.plugins) options.plugins = [];
    options.plugins.push(new cleanCss({ advanced: true }));
  }
  try {
    const output = await less.render(file, options);
    fs.outputFile(path.join(config._OUTPUT_DIR, 'css', "theme.css"), output.css, cbCompiled);
  } catch(e) {
    e.message = `Failed to render LESS. ${e.message} (at ${e.filename})`;
    throw e;
  }
};
