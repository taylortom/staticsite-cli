import config from '../js/config.js';
import fs from 'fs/promises';
import { compile } from './template.js';
import './helpers.js';
import logger from '../js/logger.js';
import mdRenderer from '../js/mdRenderer.js';
import path from 'path';

var Page = function(id, data, args) {
  this.id = id
  this.type = "page";
  for(var key in data) this[key] = data[key];
};

Page.prototype.getModel = function(customAttributes) {
  return { menu: config.menu, ...this, ...customAttributes };
};

Page.prototype.loadTemplates = async function() {
  this.templateData = {};
  await Promise.all([
    this.loadContainer(),
    this.loadPage(),
    this.loadSubPages(),
  ]);
};

Page.prototype.loadContainer = async function() {
  this.templateData.containerPage = await fs.readFile(
    path.join(config._TEMPLATES_DIR, config.templateDefaults.container), 'utf-8'
  );
};

Page.prototype.loadPage = async function() {
  var pageTemplate = this.template || config.templateDefaults.page;
  this.templateData.page = await fs.readFile(
    path.join(config._TEMPLATES_DIR, pageTemplate), 'utf-8'
  );
};

Page.prototype.loadSubPages = async function() {
  this.templateData.pages = {};
  for (const [name, page] of Object.entries(this.pages || {})) {
    var pageTemplate = page.template || config.templateDefaults.page;
    this.templateData.pages[name] = await fs.readFile(
      path.join(config._TEMPLATES_DIR, pageTemplate), 'utf-8'
    );
  }
};

Page.prototype.loadData = async function() {
  this.loadConfigData();

  if(this.type !== "page") return;

  const data = await fs.readFile(path.join(config._PAGES_DIR, this.id + ".md"), 'utf-8');
  this.body = mdRenderer(data);
};

Page.prototype.loadConfigData = function() {
  for(var key in config.globals) this[key] = config.globals[key];
  for(var key in config.pages[this.id]) this[key] = config.pages[this.id][key];
  this.theme = config.theme;
};

Page.prototype.write = async function() {
  await Promise.all([
    this.writePages(),
    this.writeSubPages()
  ]);
};

Page.prototype.writePages = async function() {
  if(!this.paginate) {
    await this.writePageDelegate(1);
    return;
  }
  var pagedAttr = this[this.paginate.pagedAttr];
  var currPage = -1;

  for (const item of pagedAttr) {
    if(item.page === currPage) continue;
    currPage = item.page;
    await this.writePageDelegate(currPage);
  }
};

Page.prototype.writePageDelegate = async function(pageNo) {
    var nameDir = (this.subDir === true) ? this.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    var filename = this.index || "index.html";
    var outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);
    // model data
    var model = this.getModel({ page: pageNo });
    await this.writePage(model, this.templateData.page, filename, outputDir);
};

Page.prototype.writeSubPages = async function() {
  for (const [name] of Object.entries(this.pages || {})) {
    var funcName = "write" + name[0].toUpperCase() + name.slice(1);
    if(this[funcName]) await this[funcName]();
  }
};

Page.prototype.writePage = async function(model, template, filename, outputDir) {
  var tmpl = compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", template));
  var html = tmpl(model);
  await fs.mkdir(outputDir, { recursive: true });

  var filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, html);
  logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
};

export default Page;
