var finalhandler = require('finalhandler');
var http = require("http");
var open = require("open");
var path = require("path");
var serveStatic = require('serve-static');

var config = require("../js/config");
var logger = require("../js/logger");

/*
* @name serve
* @description Runs local server and opens in browser
*/
module.exports = function serve(args, done) {
  var serve = serveStatic(config._OUTPUT_DIR);
  var server = http.createServer(function onRequest(req, res) {
    var done = finalhandler(req, res);
    serve(req, res, done);
  });
  // use stored value, or get a value > 8000 && < 9000
  var port = config.testing && config.testing.serverPort || Math.round(Math.random()*1000)+8000;

  server.listen(port);
  logger.task(`Running localhost at ${logger.var(config._OUTPUT_DIR)}: ${port}`);
  // let the calling code decide how to open the web page if consumed as module
  if(config._CLI_MODE) {
    open("http://localhost:" + port);
  } else {
    done(null, { url: `http://localhost:${port}` });
  }
};
