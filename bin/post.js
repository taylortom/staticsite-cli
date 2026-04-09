import config from '../js/config.js';
import { exec } from 'child_process';
import finalhandler from 'finalhandler';
import fs from 'fs/promises';
import http from 'http';
import logger from '../js/logger.js';
import open from 'open';
import path from 'path';
import prompts from 'prompts';
import serveStatic from 'serve-static';
import utils from '../js/utils.js';

/*
* @name post
* @description Creates an empty post file, opens in text editor by default or to open in browser, add --html
*/
export default async function post(args) {
  logger.task('Creating new post.');

  if (args.html) await htmlLaunch();
  else await cmdLaunch();
};

async function cmdLaunch() {
  const meta = await getMetadata();
  const dir = await writeFile(meta);
  await openEditor(dir);
}

async function htmlLaunch() {
  var server = http.createServer((req, res) => {
    switch (req.method) {
      case "GET":
        return handleGETRequest(req, res);
      case "POST":
        return handlePOSTRequest(req, res);
      default:
        return handleUnsupportedRequest(req, res);
    }
  });
  server.listen(config.testing.serverPort);
  logger.info("Opening editor");
  await open("http://localhost:" + config.testing.serverPort + "/post.html");
}

function handleGETRequest(req, res) {
  var serve = serveStatic(config._CLI_ROOT + "/editor");
  serve(req, res, finalhandler(req, res));
}

function handlePOSTRequest(req, res) {
  var body = '';
  req.on('data', function(d) { body += d; });
  req.on('end', async function() {
    const params = Object.fromEntries(new URLSearchParams(body));
    const fileDir = await writeFile(formatRequestData(params));
    logger.info("written file " + logger.file(fileDir.replace(config._POSTS_DIR, "")));

    var message = "Success!\n\nFile saved to " + fileDir;
    res.writeHead(200, { "Content-Length": message.length });
    res.end(message);
  });
}

function handleUnsupportedRequest(req, res) {
  var message = `Method '${req.method}' not supported`;
  res.writeHead(404, { "Content-Length": message.length });
  res.end(message);
}

async function getMetadata() {
  const result = await prompts([
    { type: 'text', name: 'title', message: 'Title' },
    { type: 'text', name: 'tags', message: 'Tags (comma separated, no spaces)' }
  ]);
  return formatRequestData(result);
}

function generateID(title, published) {
  return utils.formatDate(published, "YYYYMMDD") + "-" + title.replace(/ /g, "-").toLowerCase();
}

function formatRequestData(data) {
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

async function writeFile(fileData) {
  var newPostPath = path.join(config._POSTS_DIR, fileData.meta.id + ".md");
  await fs.writeFile(newPostPath, `[!META${JSON.stringify(fileData.meta)}]\n\n` + fileData.body);
  return newPostPath;
}

function openEditor(fileDir) {
  return new Promise((resolve, reject) => {
    logger.info("Launching " + logger.var(config.pages.blog.editor));
    exec(config.pages.blog.editor + " " + fileDir, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
