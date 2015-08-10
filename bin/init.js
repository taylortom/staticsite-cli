var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var log = require("../js/logger");
var nodegit = require("nodegit");
var path = require("path");
var Q = require("q");

var config = require("../config/config.json");

/*
* Downloads the repos
*/
module.exports = function init(options) {
    log("initialising website...");

    var TEMP_DIR = path.join(path.dirname(require.main.filename), "tmp");

    async.eachSeries(Object.keys(config.repos), function iterator(repo, callback) {
        fs.exists(path.join(TEMP_DIR, repo), function(exists) {
            if(!exists) {
                log("Cloning", repo);
                getRepo(repo).then(function() {
                    log("Clone successful!");
                    callback();
                }).catch(log);
            }
            else callback();
        });
    }, function done() {
        log("website initialised.");
    });

    function getRepo(name) {
        var deferred = Q.defer();

        if(!config.repos[name]) deferred.reject(new Error("No config options for '" + name + "'"));

        nodegit.Clone(config.repos[name], path.join(TEMP_DIR, name), /* options */{
            remoteCallbacks: {
                certificateCheck: function() { return 1; },
                credentials: function(url, userName) { return nodegit.Cred.sshKeyFromAgent(userName); }
            }})
            .then(deferred.resolve)
            .catch(deferred.reject);

        return deferred.promise;
    };
};
