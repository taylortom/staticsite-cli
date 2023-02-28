import fs from 'fs-extra';
import config from '../js/config';
import logger from '../js/logger';

/*
* @name clean
* @description Removes everything in the output folder
*/
export default function clean(args, cbCleaned) {
  fs.emptyDir(config._OUTPUT_DIR, function removed(error) {
    if(!error) logger.debug("Cleaned output directory");
    cbCleaned(error);
  });
};
