import async from 'async';
import config from '../js/config.js';
import fs from 'fs-extra';
import handlebars from 'handlebars';
import helpers from './helpers.js'; // initialises hbs helpers
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

Page.prototype.loadTemplates = function(cbTemplateLoaded) {
  this.templateData = {};
  async.parallel([
    this.loadContainer.bind(this),
    this.loadPage.bind(this),
    this.loadSubPages.bind(this),
  ], cbTemplateLoaded);
};

Page.prototype.loadContainer = function(cbLoaded) {
  this.loadTextFile(path.join(config._TEMPLATES_DIR, config.templateDefaults.container), function fileRead(error, data) {
    this.templateData.containerPage = data;
    cbLoaded(error);
  });
};

Page.prototype.loadPage = function(cbLoaded) {
  var pageTemplate = this.template || config.templateDefaults.page;
  this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), (error, data) => {
    this.templateData.page = data;
    cbLoaded(error);
  });
};

Page.prototype.loadSubPages = function(cbLoaded) {
  this.templateData.pages = {};
  async.forEachOf(this.pages, (page, name, cbDoneLoop) => {
    var pageTemplate = page.template || config.templateDefaults.page;
    this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), (error, data) => {
      this.templateData.pages[name] = data;
      cbDoneLoop(error);
    });
  }, cbLoaded);
};

Page.prototype.loadData = function(cbDataLoaded) {
  this.loadConfigData();

  if(this.type !== "page") {
    return cbDataLoaded();
  }
  this.loadMarkdownData(path.join(config._PAGES_DIR, this.id + ".md"), (error, mdData) => {
    if(error) return cbDataLoaded(error);
    this.body = mdData;
    cbDataLoaded();
  });
};

Page.prototype.loadConfigData = function() {
  for(var key in config.globals) this[key] = config.globals[key];
  for(var key in config.pages[this.id]) this[key] = config.pages[this.id][key];
  this.theme = config.theme;
};

Page.prototype.loadTextFile = function(filename, cbFileRead) {
  fs.readFile(filename, "utf-8", cbFileRead.bind(this));
};

Page.prototype.loadMarkdownData = function(filename, cbMarkdownLoaded) {
  this.loadTextFile(filename, function fileRead(error,data) {
    if(error) return cbMarkdownLoaded(error);
    cbMarkdownLoaded(null, mdRenderer(data));
  });
};

Page.prototype.write = function(cbWritten) {
  async.parallel([
    this.writePages.bind(this),
    this.writeSubPages.bind(this)
  ], cbWritten);
};

Page.prototype.writePages = function(cbPageWritten) {
  if(!this.paginate) {
    this.writePageDelegate(1, cbPageWritten);
    return;
  }
  var pagedAttr = this[this.paginate.pagedAttr];
  var currPage = -1;

  async.each(pagedAttr, (item, cbDoneLoop) => {
    if(item.page === currPage) return cbDoneLoop();

    currPage = item.page;
    this.writePageDelegate(currPage, cbDoneLoop);

  }, cbPageWritten);
};

Page.prototype.writePageDelegate = function(pageNo, cbPageWritten) {
    var nameDir = (this.subDir === true) ? this.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    var filename = this.index || "index.html";
    var outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);
    // model data
    var model = this.getModel({ page: pageNo });
    this.writePage(model, this.templateData.page, filename, outputDir, cbPageWritten);
};

Page.prototype.writeSubPages = function(cbPageWritten) {
  async.forEachOf(this.pages, (page, name, cbDoneLoop) => {
    var funcName = "write" + name[0].toUpperCase() + name.slice(1);
    if(this[funcName]) this[funcName].call(this, cbDoneLoop);
  }, cbPageWritten);
};

Page.prototype.writePage = function(model, template, filename, outputDir, cbPageWritten) {
  var hbsTemplate = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", template));
  var html = hbsTemplate(model);
  fs.mkdirp(outputDir, error => {
    if (error) return cbPageWritten(error);

    var filepath = path.join(outputDir, filename);
    fs.writeFile(filepath, html, error => {
      if(!error) logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
      cbPageWritten(error);
    });
  });
};

export default Page;