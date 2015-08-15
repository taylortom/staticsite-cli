var finalhandler = require('finalhandler');
var http = require("http");
var open = require("open");
var log = require("../js/logger");
var path = require("path");
var serveStatic = require('serve-static');

var config = require("../js/config");

/*
* Run local server, and opens in browser
*/
module.exports = function serve(options) {
    var serve = serveStatic(config._OUTPUT_DIR);

    var server = http.createServer(function(req, res) {

        var done = finalhandler(req, res);
        serve(req, res, done);
    });

    server.listen(config.testing.serverPort);
    log("Running local server at " + config._OUTPUT_DIR + ":" + config.testing.serverPort);

    open("http://localhost:" + config.testing.serverPort);
};
