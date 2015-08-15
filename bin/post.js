var exec = require('child_process').exec;
var log = require("../js/logger");
var fs = require("fs");
var path = require("path");
var prompt = require("prompt");
var utils = require("../js/utils");

var config = require("../js/config");

/*
*
*/
module.exports = function post(options) {
    getMetadata(function(error, meta) {
        console.log(meta);
    });
};

function getMetadata(callback) {
    prompt.get(['title', 'tags'], function (error, result) {
        if (error) return callback(error);

        // format results
        result.tags = result.tags.replace(" ","").split(",");

        // add a few extras to the results
        result.published = new Date();
        result.id = utils.formatDate(result.published, "YYYYMMDD") + "-" + result.title.replace(" ","-").toLowerCase();

        // save results to file (with meta wrapping)
        var newPostPath = path.join(config._POSTS_DIR, result.id + ".md");

        fs.writeFile(newPostPath, "!META" + JSON.stringify(result), function(error) {
            if(error) return log(error);

            exec("atom " + newPostPath, function(error, stdout, stderr) {
                if(error) log(error);
                if(stdout) log(stdout);
                if(stderr) log(stderr);
            });
        });
    });
};
