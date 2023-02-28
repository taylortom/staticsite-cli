import config from '../js/config.js';
import finalhandler from 'finalhandler';
import http from 'http';
import logger from '../js/logger.js';
import serveStatic from 'serve-static';

/*
* @name serve
* @description Runs local server and opens in browser
*/
export default function serve(args, done) {
  var serve = serveStatic(config._OUTPUT_DIR);
  var server = http.createServer(function onRequest(req, res) {
    console.log('onRequest:', req.originalUrl);
    var done = finalhandler(req, res);
    serve(req, res, done);
  });
  // use stored value, or get a value > 8000 && < 9000
  var port = config.server && config.server.port || config.testing && config.testing.serverPort || Math.round(Math.random()*1000)+8000;

  server.listen(port);
  logger.task(`Running localhost at ${logger.var(config._OUTPUT_DIR)}: ${port}`);
};
