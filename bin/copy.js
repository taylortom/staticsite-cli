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
  return Promise.all(files.map(async file => {
    // skip blacklisted files/files beginning with . or _
    if(config.blacklist.includes(file) || file.match(/^\.|^_/)) {
      return;
    }
    await fs.copy(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), { clobber: true, preserveTimestamps: true });
    logger.debug("Copied " + logger.file(file));
  }));
};
