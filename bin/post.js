var exec = require('child_process').exec;
var logger = require("../js/logger");
var fs = require("fs");
var path = require("path");
var prompt = require("prompt");
var utils = require("../js/utils");

var config = require("../js/config");

/*
* Creates an empty post file, opens in editor
*/
module.exports = function post(options) {
    logger.command('Creating new post.');
    getMetadata(function gotMeta(error, meta) {
        logger.log(meta);
    });
};

function getMetadata(cbGotMeta) {
    prompt.get(['title', 'tags'], function gotInput(error, result) {
        if (error) return cbGotMeta(error);
        // format results
        result.tags = result.tags.replace(/ /g,"").split(",").filter(function notEmpty(value){ return value !== ""; });
        // add a few extras to the results
        result.published = new Date();
        result.id = utils.formatDate(result.published, "YYYYMMDD") + "-" + result.title.replace(/ /g,"-").toLowerCase();
        // save results to file (with meta wrapping)
        var newPostPath = path.join(config._POSTS_DIR, result.id + ".md");

        fs.writeFile(newPostPath, "[!META" + JSON.stringify(result) + "]\n\n", function written(error) {
            if(error) return cbGotMeta(error);

            exec(config.pages.blog.editor + " " + newPostPath, function executed(error, stdout, stderr) {
                logger.done("Launching " + logger.var(config.pages.blog.editor));
                if(error) return cbGotMeta(error);
                if(stdout) logger.log(stdout);
                if(stderr) return cbGotMeta(stderr);
            });
        });
    });
};
