var _ = require("underscore");
var async = require("async");
var fs = require("fs.extra");
var handlebars = require("handlebars");
var mdRenderer = require("../js/mdRenderer");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

var Page = module.exports = function(id, data, args) {
    this.id = id
    this.type = "page";
    for(var key in data) this[key] = data[key];
}

Page.prototype.loadTemplates = function(cbTemplateLoaded) {
    this.templateData = {};
    async.parallel([
        _.bind(this.loadContainer, this),
        _.bind(this.loadPage, this),
        _.bind(this.loadSubPages, this),
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
    this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), function fileRead(error, data) {
        this.templateData.page = data;
        cbLoaded(error);
    });
};

Page.prototype.loadSubPages = function(cbLoaded) {
    this.templateData.pages = {};
    async.forEachOf(this.pages, _.bind(function(page, name, cbDoneLoop) {
        var pageTemplate = page.template || config.templateDefaults.page;
        this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), function fileRead(error, data) {
            this.templateData.pages[name] = data;
            cbDoneLoop(error);
        });
    }, this), cbLoaded);
};

Page.prototype.loadData = function(cbDataLoaded) {
    this.loadConfigData();
    if(this.type === "page") {
        this.loadMarkdownData(path.join(config._PAGES_DIR, this.id + ".md"), _.bind(function gotContent(error, mdData) {
            if(error) return cbDataLoaded(error);
            this.body = mdData;
            cbDataLoaded();
        }, this));

    } else {
        cbDataLoaded();
    }
};

Page.prototype.loadConfigData = function() {
    for(var key in config.globals) this[key] = config.globals[key];
    for(var key in config.pages[this.id]) this[key] = config.pages[this.id][key];
};

Page.prototype.loadTextFile = function(filename, cbFileRead) {
    fs.readFile(filename, "utf-8", _.bind(cbFileRead, this));
};

Page.prototype.loadMarkdownData = function(filename, cbMarkdownLoaded) {
    this.loadTextFile(filename, function fileRead(error,data) {
        if(error) return cbMarkdownLoaded(error);
        cbMarkdownLoaded(null, mdRenderer(data));
    });
};

Page.prototype.write = function(cbWritten) {
    async.parallel([
        _.bind(this.writePages, this),
        _.bind(this.writeSubPages, this)
    ], cbWritten);
};

Page.prototype.writePages = function(cbPageWritten) {
    if(this.paginate) {
        var pagedAttr = this[this.paginate.pagedAttr];
        var currPage = -1;
        var totalPages = this.paginate.totalPages = pagedAttr[pagedAttr.length-1].page;

        async.each(pagedAttr, _.bind(function iterator(item, cbDoneLoop) {
            if(item.page !== currPage) {
                currPage = item.page;
                this.writePageDelegate(currPage, cbDoneLoop);
            } else cbDoneLoop();
        },this), cbPageWritten);
    } else {
        this.writePageDelegate(1, cbPageWritten);
    }
};
Page.prototype.writePageDelegate = function(pageNo, cbPageWritten) {
    var nameDir = (this.subDir === true) ? this.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    var filename = this.index || "index.html";
    var outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);

    // model data
    var model = _.extend({ page: pageNo }, this);
    this.writePage(model, this.templateData.page, filename, outputDir, cbPageWritten);
};

Page.prototype.writeSubPages = function(cbPageWritten) {
    async.forEachOf(this.pages, _.bind(function(page, name, cbDoneLoop) {
        var funcName = "write" + name[0].toUpperCase() + name.slice(1);
        if(this[funcName]) this[funcName].call(this, cbDoneLoop);
    }, this), cbPageWritten);
};

Page.prototype.writePage = function(model, template, filename, outputDir, cbPageWritten) {
    var hbsTemplate = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", template));
    var html = hbsTemplate(model);
    fs.mkdirp(outputDir, _.bind(function onMkdir(error) {
        if (error) return cbPageWritten(error);
        var filepath = path.join(outputDir, filename);
        fs.writeFile(filepath, html, _.bind(function(error) {
            if(!error) logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
            cbPageWritten(error);
        },this));
    },this));
};
