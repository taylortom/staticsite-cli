import config from '../js/config.js';
import { exec } from 'child_process';
import finalhandler from 'finalhandler';
import fs from 'fs';
import http from 'http';
import logger from '../js/logger.js';
import opn from 'opn';
import path from 'path';
import prompt from 'prompt';
import qs from 'querystring';
import serveStatic from 'serve-static';
import utils from '../js/utils.js';

/*
* @name post
* @description Creates an empty post file, opens in text editor by default or to open in browser, add --html
*/
export default function post(args, cbPosted) {
  logger.task('Creating new post.');

  if(args.html) htmlLaunch(cbPosted);
  else cmdLaunch(cbPosted);
};

// TODO waterfall
function cmdLaunch(cbDone) {
  getMetadata(function gotMeta(error, meta) {
    if(error) return cbDone(error);

    writeFile(meta, function(error, dir) {
      if(error) return logger.error(error);

      openEditor(dir, cbDone);
    });
  });
};

function htmlLaunch(cbDone) {
  // set up local server
  var server = http.createServer((req, res) => {
    console.log(req.method);
    switch(req.method) {
      case "GET":
        return handleGETRequest(req, res);
      case "POST":
        handlePOSTRequest(req, res, cbDone);
      default:
        return handleUnsupportedRequest(req, res);
    }
  });
  server.listen(config.testing.serverPort);
  // open in browser
  logger.info("Opening editor");
  opn("http://localhost:" + config.testing.serverPort + "/post.html");
}

function handleGETRequest(req, res) {
  var serve = serveStatic(config._CLI_ROOT + "/editor");
  serve(req, res, finalhandler(req, res));
}

function handlePOSTRequest(req, res, next) {
  var body = '';
  req.on('data', function(d) { body += d; });
  req.on('end', function() {
    writeFile(formatRequestData(qs.parse(body)), function(error, fileDir) {
      logger.info("written file " + logger.file(fileDir.replace(config._POSTS_DIR,"")));

      var message = "Success!\n\nFile saved to " + fileDir
      res.writeHead(200, { "Content-Length": message.length });
      res.end(message);
    });
  });
}

function handleUnsupportedRequest(req, res) {
  var message = `Method '${req.method}' not supported`;
  res.writeHead(404, { "Content-Length": message.length });
  res.end(message);
}

function getMetadata(cbGotMeta) {
  prompt.get({
    properties: {
      title: { message: 'Title' },
      tags: { message: 'Tags (comma separated, no spaces)' }
    }
  }, function gotInput(error, result) {
    if (error) return cbGotMeta(error);
    cbGotMeta(null, formatRequestData(result));
  });
}

function generateID(title, published) {
  return utils.formatDate(published, "YYYYMMDD") + "-" + title.replace(/ /g,"-").toLowerCase();
}

function formatRequestData(data) {
  // no whitespace here please
  data.title = data.title.trim();
  var published = new Date();
  return {
    meta: {
      id: generateID(data.title, published),
      title: data.title,
      published: published,
      tags: data.tags.split(",").filter(Boolean)
    },
    body: data.body || ""
  };
}

// save results to file (with meta wrapping)
function writeFile(fileData, cbFileWritten) {
  var newPostPath = path.join(config._POSTS_DIR, fileData.meta.id + ".md");
  fs.writeFile(newPostPath, `[!META${JSON.stringify(fileData.meta)}]\n\n` + fileData.body, function(error) {
    cbFileWritten(error, newPostPath);
  });
}

function openEditor(fileDir, cbOpenedEditor) {
  logger.info("Launching " + logger.var(config.pages.blog.editor));
  exec(config.pages.blog.editor + " " + fileDir, cbOpenedEditor);
}
