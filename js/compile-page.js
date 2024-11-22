import config from '../js/config.js';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import helpers from './helpers.js'; // initialises hbs helpers
import logger from '../js/logger.js';
import mdRenderer from '../js/mdRenderer.js';
import path from 'path';

const Page = function(id, data, args) {
  this.id = id
  this.type = "page";
  for(let key in data) this[key] = data[key];
};

Page.prototype.getModel = function(customAttributes) {
  return { menu: config.menu, ...this, ...customAttributes };
};

Page.prototype.loadTemplates = function() {
  this.templateData = {};
  return Promise.all([
    this.loadContainer(),
    this.loadPage(),
    this.loadSubPages(),
  ]);
};

Page.prototype.loadContainer = async function() {
  this.templateData.containerPage = await this.loadTextFile(path.join(config._TEMPLATES_DIR, config.templateDefaults.container));
};

Page.prototype.loadPage = function() {
  const pageTemplate = this.template || config.templateDefaults.page;
  this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), (error, data) => {
    this.templateData.page = data;
    cbLoaded(error);
  });
};

Page.prototype.loadSubPages = function() {
  this.templateData.pages = {};
  return Promise.all(Object.entries(this.pages).map(async ([name, page]) => {
    const template = page.template ?? config.templateDefaults.page;
    this.templateData.pages[name] = await this.loadTextFile(path.join(config._TEMPLATES_DIR, template));
  }));
};

Page.prototype.loadData = function() {
  this.loadConfigData();
  if(this.type !== "page") {
    return;
  }
  this.body = await this.loadMarkdownData(path.join(config._PAGES_DIR, this.id + ".md"));
};

Page.prototype.loadConfigData = function() {
  for(let key in config.globals) this[key] = config.globals[key];
  for(let key in config.pages[this.id]) this[key] = config.pages[this.id][key];
  this.theme = config.theme;
};

Page.prototype.loadTextFile = function(filename) {
  return fs.readFile(filename, "utf-8");
};

Page.prototype.loadMarkdownData = function(filename) {
  return mdRenderer(await this.loadTextFile(filename));
};

Page.prototype.write = function() {
  return Promise.all([this.writePages(), this.writeSubPages()]);
};

Page.prototype.writePages = function() {
  if(!this.paginate) {
    return this.writePageDelegate(1);
  }
  let currPage = -1;

  return Promise.all(this[this.paginate.pagedAttr].map(item => {
    if(item.page === currPage) return;
    currPage = item.page;
    return this.writePageDelegate(currPage);
  }));
};

Page.prototype.writePageDelegate = function(pageNo) {
  const nameDir = (this.subDir === true) ? this.id : "";
  const pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
  const filename = this.index || "index.html";
  const outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);
  const model = this.getModel({ page: pageNo });
  return this.writePage(model, this.templateData.page, filename, outputDir);
};

Page.prototype.writeSubPages = function() {
  return Promise.all(Object.keys(this.pages).map(name => {
    const funcName = "write" + name[0].toUpperCase() + name.slice(1);
    if(this[funcName]) return this[funcName].call(this);
  }));
};

Page.prototype.writePage = async function(model, template, filename, outputDir) {
  try {
    await fs.mkdir(outputDir);
  } catch(e) {
    if(e.code !== 'EEXIST') throw e;
  }
  const filepath = path.join(outputDir, filename);
  const hbsTemplate = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", template));
  await fs.writeFile(filepath, hbsTemplate(model));
  logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
};

export default Page;