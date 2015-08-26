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
* TODO split these into cmd, html
*/
module.exports = function post(args) {
    logger.task('Creating new post.');
    if(args.html) {
        htmlLaunch();
    } else {
        cmdLaunch();
    }
};

// TODO waterfall
function cmdLaunch() {
    getMetadata(function gotMeta(error, meta) {
        if(error) return logger.error(error);

        writeFile({ meta:meta }, function(error, dir) {
            if(error) return logger.error(error);

            openEditor(dir, function(error) {
                if(error) logger.error(error);
            });
        });
    });
};

function htmlLaunch() {
    // set up local server
    var serve = serveStatic(config._CLI_ROOT + "/editor");
    var server = http.createServer(function serverReady(req, res) {
        if(req.method === "POST") {
            var body = '';
            req.on('data', function(d) { body += d; });
            req.on('end', function() {
                res.writeHead(200, { "Content-Length": 25 });
                res.end("Post created successfully");
                writeFile(formatRequestData(qs.parse(body)), function(error, fileDir) {
                    console.log("written file " + fileDir.replace(config._POSTS_DIR,""));
                    process.exit()
                });
            });
        } else {
            var done = finalhandler(req, res);
            serve(req, res, done);
        }
    });
    server.listen(config.testing.serverPort);
    // open in browser
    open("http://localhost:" + config.testing.serverPort + "/post.html");
};

function getMetadata(cbGotMeta) {
    prompt.get(['title', 'tags'], function gotInput(error, result) {
        if (error) return cbGotMeta(error);
        // format results
        result.tags = result.tags.replace(/ /g,"").split(",").filter(function notEmpty(value){ return value !== ""; });
        // add a few extras to the results
        result.published = new Date();
        result.id = generateID(result.title, result.published);

        cbGotMeta(null, result);
    });
};

function generateID(title, published) {
    return utils.formatDate(published, "YYYYMMDD") + "-" + title.replace(/ /g,"-").toLowerCase();
};

function formatRequestData(data) {
    var published = new Date();
    return {
        meta: {
            id: generateID(data.title, published),
            title: data.title,
            published: published,
            tags: data.tags
        },
        title: data.title,
        body: data.body
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
    logger.done("Launching " + logger.var(config.pages.blog.editor));
    exec(config.pages.blog.editor + " " + fileDir, cbOpenedEditor);
};
