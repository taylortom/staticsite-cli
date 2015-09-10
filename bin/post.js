var _ = require('underscore');
var exec = require('child_process').exec;
var finalhandler = require('finalhandler');
var fs = require("fs");
var http = require("http");
var open = require("open");
var path = require("path");
var prompt = require("prompt");
var qs = require('querystring');
var serveStatic = require('serve-static');

var config = require("../js/config");
var logger = require("../js/logger");
var utils = require("../js/utils");

/*
* Creates an empty post file, opens in editor
*/
module.exports = function post(args, cbPosted) {
    logger.task('Creating new post.');

    if(args.html) htmlLaunch(cbPosted);
    else cmdLaunch(cbPosted);
};

// TODO waterfall
function cmdLaunch(cbDone) {
    getMetadata(function gotMeta(error, meta) {
        if(error) return cbDone(error);

        writeFile(meta, function(error, dir) {
            if(error) return logger.error(error);

            openEditor(dir, function(error) {
                if(error) return cbDone(error);
                cbDone();
            });
        });
    });
};

function htmlLaunch(cbDone) {
    // set up local server
    var serve = serveStatic(config._CLI_ROOT + "/editor");
    var server = http.createServer(function serverReady(req, res) {
        if(req.method === "POST") {
            var body = '';
            req.on('data', function(d) { body += d; });
            req.on('end', function() {
                writeFile(formatRequestData(qs.parse(body)), function(error, fileDir) {
                    logger.info("written file " + logger.file(fileDir.replace(config._POSTS_DIR,"")));

                    var message = "Success!\n\nFile saved to " + fileDir
                    res.writeHead(200, { "Content-Length": message.length });
                    res.end(message);

                    cbDone();
                });
            });
        } else {
            var done = finalhandler(req, res);
            serve(req, res, done);
        }
    });
    server.listen(config.testing.serverPort);
    // open in browser
    logger.info("Opening editor");
    open("http://localhost:" + config.testing.serverPort + "/post.html");
};

function getMetadata(cbGotMeta) {
    prompt.get({
            properties: {
                title: { message: 'Title' },
                tags: { message: 'Tags (comma separated, no spaces)' }
            }
        }, function gotInput(error, result) {
            if (error) return cbGotMeta(error);
            cbGotMeta(null, formatRequestData(result));
        }
    );
};

function generateID(title, published) {
    return utils.formatDate(published, "YYYYMMDD") + "-" + title.replace(/ /g,"-").toLowerCase();
};

function formatRequestData(data) {
    // no whitespace here please
    data.title = data.title.trim();
    var published = new Date();
    return {
        meta: {
            id: generateID(data.title, published),
            title: data.title,
            published: published,
            tags: data.tags.split(",").filter(function(element) { return !_.isEmpty(element); })
        },
        body: data.body || ""
    };
}

// save results to file (with meta wrapping)
function writeFile(fileData, cbFileWritten) {
    var newPostPath = path.join(config._POSTS_DIR, fileData.meta.id + ".md");
    fs.writeFile(newPostPath, "[!META" + JSON.stringify(fileData.meta) + "]\n\n" + fileData.body, function(error) {
        cbFileWritten(error, newPostPath);
    });
};

function openEditor(fileDir, cbOpenedEditor) {
    logger.info("Launching " + logger.var(config.pages.blog.editor));
    exec(config.pages.blog.editor + " " + fileDir, cbOpenedEditor);
};
