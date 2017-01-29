var async = require("async");
var fs = require("fs");
var nodegit = require("nodegit");
var path = require("path");
var Q = require("q");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name init
* @description Downloads the repos and readies the file system
*/
module.exports = function init(args) {
  async.eachSeries(Object.keys(config.repos), function iterator(repo, cbDoneLoop) {
    fs.exists(path.join(config._TEMP_DIR, repo), function gotExists(exists) {
      if(exists) {
        // TODO update git repo
        return cbDoneLoop();
      }
      logger.debug("Cloning", logger.file(repo));
      getRepo(repo).then(function() {
        logger.debug("Clone successful");
        cbDoneLoop();
      }).catch(logger.error);
    });
  }, function done() {
      logger.done("website initialised");
  });

  function getRepo(name) {
    var deferred = Q.defer();

    if(!config.repos[name]) deferred.reject(new Error(`No config options for '${name}'`));

    nodegit.Clone(config.repos[name], path.join(config._TEMP_DIR, name),{
      remoteCallbacks: {
        certificateCheck: function() { return 1; },
        credentials: function(url, userName) { return nodegit.Cred.sshKeyFromAgent(userName); }
      }})
      .then(deferred.resolve)
      .catch(deferred.reject);

    return deferred.promise;
  }
};
