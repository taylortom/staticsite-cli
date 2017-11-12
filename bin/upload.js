var async = require("async");
var fs = require("fs");
var ftp = require("ftp");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name upload
* @description Uploads the tmp/site files to the specified server via FTP
*
* NOTE: assumes uploads are intended for '/'. If this isn't the case, you may
* want to create a specific FTP account with access only to the required dir
*/
module.exports = function upload(args, cbUploaded) {
  logger.task('Connecting to server');

  var ftpConfig = {
    host: config.ftp.host,
    port: config.ftp.port || 21,
    user: config.ftp.user,
    password: config.ftp.password,
    connTimeout: 5000
  };

  var client = new ftp();
  client.connect(ftpConfig);
  client.on('error', exit);
  client.on('ready', function connReady() {
    logger.debug(`Connected to server ${logger.var(ftpConfig.host)} as ${logger.var(ftpConfig.user)}`);
    logger.task("Cleaning remote folder");
    cleanRemote(function cleaned(error) {
      if(error) {
        return exit(error);
      }
      logger.task('Uploading files to server');
      uploadDir(config._OUTPUT_DIR, exit);
    });
  });

  function exit(error) {
    (error) ? client.destroy() : client.end();
    cbUploaded(error);
  }

  function cleanRemote(cbCleaned) {
    client.list('/', function gotList(error, files) {
      async.each(files, function iterator(file, cbDoneLoop) {
        var _doneHandler = function(error) {
          if(error) cbCleaned(error);
          else cbDoneLoop();
        };
        if(file.name[0] === ".") { // ignore hidden files
          return cbDoneLoop();
        }
        if(file.type === "d") { // directory
          return client.rmdir(file.name, true, _doneHandler);
        }
        // file
        client.delete(file.name, _doneHandler);
      }, cbCleaned);
    });
  }

  function uploadDir(dir, cbDoneUpload) {
    async.waterfall([
      async.apply(makeDir, dir),
      async.apply(fs.readdir, dir),
      function(files, cb) {
        async.each(files, function iterator(file, cbDoneLoop) {
          if(file[0] === ".") return cbDoneLoop();
          // loop through all files
          fs.stat(path.join(dir,file), function gotStats(error, stats) {
            if(error) return cbDoneLoop(error);
            var func = stats.isDirectory() ? uploadDir : uploadFile;
            func.call(this, path.join(dir,file), cbDoneLoop);
          });
        }, cbDoneUpload);
      }
    ], cbDoneUpload);
  }

  function makeDir(localDir, cbMadeDir) {
    var remoteDir = localDir.replace(config._OUTPUT_DIR, "/").slice(1);
    if(!remoteDir) {
      return cbMadeDir();
    }
    client.mkdir(remoteDir, function(error) {
      cbMadeDir(error);
    });
  }

  function uploadFile(file, cbDoneUpload) {
    var localDir = file.replace(config._OUTPUT_DIR, "").slice(1);
    client.put(file, "/" + localDir, function(error) {
      if(error) return cbDoneUpload(error);
      logger.debug("Uploaded " + logger.file(localDir));
      cbDoneUpload();
    });
  }
};
