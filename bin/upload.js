var async = require("async");
var fs = require("fs");
var ftp = require("ftp");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name upload
* @description TODO: Uploads the tmp/site files to the specified server via FTP
*/
module.exports = function upload(args, cbUploaded) {
  logger.task('Connecting to server');
  var client = new ftp();
  client.connect(ftpConfig);

  // TODO encrypt these and store somewhere
  var ftpConfig = {
    host: config.server.host,
    port: config.server.port,
    user: config.server.user,
    password: config.server.password,
    connTimeout: 5000
  };

  client.on('error', cbUploaded);
  client.on('ready', function connReady() {
    logger.debug(`Connected to server ${logger.var(ftpConfig.host)} as ${logger.var(ftpConfig.user)}`);
    cleanRemote(function cleaned(error) {
      if(error) {
        client.end();
        return cbUploaded(error);
      }
      logger.task("Cleaning remote folder");

      logger.task('Uploading files to server');
      uploadDir(config._OUTPUT_DIR, function(error) {
        client.end();
        return cbUploaded(error);
      });
    });
  });

  function cleanRemote(cbCleaned) {
    client.list(config.server.base, function gotList(error, files) {
      async.each(files, function iterator(file, cbDoneLoop) {
        if(file.name[0] === ".") {
          return cbDoneLoop();
        }
        if(file.type === "d") {
          client.rmdir(config.server.base + file.name, true, function(error) {
            if(error) cbCleaned(error);
            else cbDoneLoop();
          });
        } else {
          client.delete(config.server.base + file.name, function(error) {
            if(error) cbCleaned(error);
            else cbDoneLoop();
          });
        }
      }, cbCleaned);
    });
  }

  // TODO avoid this nesting
  function uploadDir(dir, cbDoneUpload) {
    makeDir(dir, function madeDir(error) {
      if(error) return cbDoneUpload(error);

      fs.readdir(dir, function(error, files) {
        if(error) return cbDoneUpload(error);

        async.each(files, function iterator(file, cbDoneLoop) {
          if(file[0] === ".") return cbDoneLoop();

          fs.stat(path.join(dir,file), function gotStats(error, stats) {
            if(error) return cbDoneLoop(error);
            var func = stats.isDirectory() ? uploadDir : uploadFile;
            func.call(this, path.join(dir,file), cbDoneLoop);
          });
        }, cbDoneUpload);
      });
    });
  }

  function makeDir(localDir, cbMadeDir) {
    var remoteDir = localDir.replace(config._OUTPUT_DIR, "").slice(1);
    if(remoteDir) client.mkdir(config.server.base + "/" + remoteDir, cbMadeDir);
    else cbMadeDir();
  }

  function uploadFile(file, cbDoneUpload) {
    var localDir = file.replace(config._OUTPUT_DIR, "").slice(1);
    client.put(file, config.server.base + "/" + localDir, function(error) {
      if(error) return cbDoneUpload(error);
      logger.debug("Uploaded " + logger.file(localDir));
      cbDoneUpload();
    });
  }
};
