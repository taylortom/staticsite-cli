import config from '../js/config.js';
import fs from 'fs/promises';
import logger from '../js/logger.js';
import path from 'path';

/*
* @name copy
* @description Copies files/folders in _SRC_DIR not prefixed with _ or . or blacklisted
*/
export default async function copy(args) {
  const files = await fs.readdir(config._SRC_DIR);
  for (const file of files) {
    if (config.blacklist.includes(file) || file.match(/^\.|^_/)) continue;
    await fs.cp(
      path.join(config._SRC_DIR, file),
      path.join(config._OUTPUT_DIR, file),
      { recursive: true, preserveTimestamps: true }
    );
    logger.debug("Copied " + logger.file(file));
  }
};
