import async from 'async';
import config from '../js/config.js';
import fs from 'fs';
import logger from '../js/logger.js';
import nodegit from 'nodegit';
import path from 'path';

/*
* @name init
* @description Downloads the repos and readies the file system
*/
export default function init(args) {
  async.eachSeries(Object.keys(config.repos), function iterator(repo, cbDoneLoop) {
    fs.exists(path.join(config._TEMP_DIR, repo), function gotExists(exists) {
      if(exists) { // TODO update git repo
        return cbDoneLoop();
      }
      logger.debug("Cloning", logger.file(repo));
      getRepo(repo).then(function() {
        logger.debug("Clone successful");
        cbDoneLoop();
      }).catch(logger.error);
    });
  }, () => logger.done("website initialised"));

  async function getRepo(name) {
    if(!config.repos[name]) {
      throw new Error(`No config options for '${name}'`);
    }
    nodegit.Clone(config.repos[name], path.join(config._TEMP_DIR, name), {
      remoteCallbacks: {
        certificateCheck: () => 1,
        credentials: (url, userName) => nodegit.Cred.sshKeyFromAgent(userName)
      }});
  }
};
