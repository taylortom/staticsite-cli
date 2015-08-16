var finalhandler = require('finalhandler');
var http = require("http");
var open = require("open");
var logger = require("../js/logger");
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
    logger.done("Running localhost at " + logger.var(config._OUTPUT_DIR.replace(config._CLI_ROOT, "") + ":" + config.testing.serverPort));

    open("http://localhost:" + config.testing.serverPort);
};
