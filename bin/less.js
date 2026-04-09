import fs from 'fs/promises';
import config from '../js/config.js';
import path from 'path';
import less from 'less';

/*
* @name less
* @description Compiles the less to the output folder
*/
export default async function(args) {
  const file = await fs.readFile(path.join(config._LESS_DIR, config.theme.main), 'utf-8');
  var options = { ...config.theme.options, paths: [config._LESS_DIR] };

  try {
    const output = await less.render(file, options);
    const outputDir = path.join(config._OUTPUT_DIR, 'css');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'theme.css'), output.css);
  } catch(error) {
    error.message = `Failed to render LESS. ${error.message} (at ${error.filename})`;
    throw error;
  }
};
