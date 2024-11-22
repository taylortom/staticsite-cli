import fs from 'fs/promises';
import config from '../js/config.js';
import logger from '../js/logger.js';

/*
* @name clean
* @description Removes everything in the output folder
*/
export default async function clean(args) {
  await fs.rm(config._OUTPUT_DIR, { recursive: true });
  await fs.mkdir(config._OUTPUT_DIR);
  logger.debug("Cleaned output directory");
};
