var async = require("async");
var fs = require("fs");
var ftp = require("ftp");
var logger = require("./logger");
var path = require("path");

/*
* Uploads the tmp/site files to the specified server via FTP
*/
module.exports = function upload(cbUploaded) {
    var config = require("./config");
    var client = new ftp();

    // TODO encrypt these and store somewhere
    var ftpConfig = {
        host: config.server.host,
        port: config.server.port,
        user: config.server.user,
        password: config.server.password
    };

    client.on('error', handleError);

    client.on('ready', function connReady() {
        logger.info('Connected to server as ' + logger.var(ftpConfig.host) + " as " + logger.var(ftpConfig.user));
        logger.task('Uploading files to server');
        cleanRemote(function cleaned(error) {
            if(error) return handleError(error);

            uploadDir(config._OUTPUT_DIR, function(error) {
                if(error) return handleError(error);
                client.end();
                cbUploaded();
            });
        });
    });

    // self starting
    (function start() {
        client.connect(ftpConfig);
    })();

    function handleError(error) {
        client.end();
        cbUploaded(error);
    };

    function cleanRemote(cbCleaned) {
        client.list(config.server.base, function gotList(error, files) {
            async.each(files, function iterator(file, cbDoneLoop) {
                if(file.name[0] === ".") return cbDoneLoop();
                else if(file.type === "d") client.rmdir(config.server.base + file.name, true, cbDoneLoop)
                else client.delete(config.server.base + file.name, cbDoneLoop);
            }, cbCleaned);
        });
    };

    function uploadDir(dir, cbDoneUpload) {
        makeDir(dir, function madeDir(error) {
            if(error) return cbDoneUpload(error);

            fs.readdir(dir, function(error, files) {
                if(error) return cbDoneUpload(error);

                async.each(files, function iterator(file, cbDoneLoop) {
                    if(file[0] === ".") return cbDoneLoop();

                    fs.stat(path.join(dir,file), function gotStats(error, stats) {
                        if(error) return cbDoneUpload(error);

                        if(stats.isDirectory()) uploadDir(path.join(dir,file), cbDoneLoop);
                        else uploadFile(path.join(dir,file), cbDoneLoop);
                    });
                }, cbDoneUpload);
            });
        });
    };

    function makeDir(localDir, cbMadeDir) {
        var remoteDir = localDir.replace(config._OUTPUT_DIR, "").slice(1);
        if(remoteDir) client.mkdir(config.server.base + "/" + remoteDir, cbMadeDir);
        else cbMadeDir();
    };

    function uploadFile(file, cbDoneUpload) {
        var localDir = file.replace(config._OUTPUT_DIR, "").slice(1);
        client.put(file, config.server.base + "/" + localDir, function(error) {
            if(error) return handleError(error);
            logger.debug("Uploaded " + logger.file(localDir));
            cbDoneUpload();
        });
    }
};
