import config from '../js/config.js';
import { existsSync } from 'fs';
import logger from '../js/logger.js';
import nodegit from 'nodegit';
import path from 'path';

/*
* @name init
* @description Downloads the repos and readies the file system
*/
export default async function init(args) {
  for (const repo of Object.keys(config.repos)) {
    if (existsSync(path.join(config._TEMP_DIR, repo))) continue;

    if (!config.repos[repo]) {
      throw new Error(`No config options for '${repo}'`);
    }
    logger.debug("Cloning", logger.file(repo));
    await nodegit.Clone(config.repos[repo], path.join(config._TEMP_DIR, repo), {
      remoteCallbacks: {
        certificateCheck: () => 1,
        credentials: (url, userName) => nodegit.Cred.sshKeyFromAgent(userName)
      }
    });
    logger.debug("Clone successful");
  }
};
