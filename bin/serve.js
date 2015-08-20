var finalhandler = require('finalhandler');
var http = require("http");
var open = require("open");
var path = require("path");
var serveStatic = require('serve-static');

var config = require("../js/config");
var logger = require("../js/logger");

/*
* Runs local server, and opens in browser
*/
module.exports = function serve(args) {
    // set up local server
    var serve = serveStatic(config._OUTPUT_DIR);
    var server = http.createServer(function onRequest(req, res) {
        var done = finalhandler(req, res);
        serve(req, res, done);
    });
    server.listen(config.testing.serverPort);
    // open in browser
    logger.task("Running localhost at " + logger.var(config._OUTPUT_DIR.replace(config._CLI_ROOT, "") + ":" + config.testing.serverPort));
    open("http://localhost:" + config.testing.serverPort);
};
