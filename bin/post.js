var exec = require('child_process').exec;
var log = require("../js/logger");
var fs = require("fs");
var path = require("path");
var prompt = require("prompt");
var utils = require("../js/utils");

var config = require("../js/config");

/*
* Creates an empty post file
*/
module.exports = function post(options) {
    getMetadata(function gotMeta(error, meta) {
        console.log(meta);
    });
};

function getMetadata(cbGotMeta) {
    prompt.get(['title', 'tags'], function gotInput(error, result) {
        if (error) return cbGotMeta(error);
        // format results
        result.tags = result.tags.replace(" ","").split(",");
        // add a few extras to the results
        result.published = new Date();
        result.id = utils.formatDate(result.published, "YYYYMMDD") + "-" + result.title.replace(/ /g,"-").toLowerCase();
        // save results to file (with meta wrapping)
        var newPostPath = path.join(config._POSTS_DIR, result.id + ".md");

        fs.writeFile(newPostPath, "!META" + JSON.stringify(result) + "\n\n", function written(error) {
            if(error) return cbGotMeta(error);

            exec("atom " + newPostPath, function executed(error, stdout, stderr) {
                if(error) return cbGotMeta(error);
                if(stdout) log(stdout);
                if(stderr) return cbGotMeta(stderr);
            });
        });
    });
};
