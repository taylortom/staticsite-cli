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
  var port = config?.server?.port ?? config?.testing?.serverPort ?? Math.round(Math.random()*1000)+8000;
  http.createServer((req, res) => {
    serveStatic(config._OUTPUT_DIR)(req, res, finalhandler(req, res));
  }).listen(port, () => logger.task(`Running localhost at ${logger.var(config._OUTPUT_DIR)}: ${port}`));
};
