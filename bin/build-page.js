var _ = require("underscore");
var async = require("async");
var fs = require("fs.extra");
var handlebars = require("handlebars");
var mdRenderer = require("../js/mdRenderer");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");

var Page = module.exports = function(id, data) {
    this.id = id
    this.type = "page";
    // copy over config data
    for(var key in data) this[key] = data[key];
}

Page.prototype.loadTemplates = function(cbTemplateLoaded) {
    this.templateData = {};
    // containerPage
    this.loadTextFile(path.join(config._TEMPLATES_DIR, config.templateDefaults.container), function fileRead(error, data) {
        this.templateData.containerPage = data;
        // page
        var pageTemplate = this.templates && this.templates.page || config.templateDefaults.page;
        this.loadTextFile(path.join(config._TEMPLATES_DIR, pageTemplate), function fileRead(error, data) {
            this.templateData.page = data;
            cbTemplateLoaded(error);
        });
    });
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
    if(this.paginate) {
        var pagedAttr = this[this.paginate.pagedAttr];
        var currPage = -1;
        var totalPages = this.paginate.totalPages = pagedAttr[pagedAttr.length-1].page;

        async.each(pagedAttr, _.bind(function iterator(item, cbDoneLoop) {
            if(item.page !== currPage) {
                currPage = item.page;
                this.writePage(currPage, cbDoneLoop);
            } else cbDoneLoop();
        },this), cbWritten);

    } else {
        this.writePage(1, cbWritten);
    }
};

Page.prototype.writePage = function(pageNo, cbPageWritten) {
    // work out the output path
    var nameDir = (this.subDir === true) ? this.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    var outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);
    var template = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", this.templateData.page));
    var html = template({
        pageModel: this,
        page: pageNo
    });
    // make all dirs
    fs.mkdirp(outputDir, _.bind(function onMkdir(error) {
        if (error) return cbPageWritten(error);
        var filepath = path.join(outputDir, this.index || "index.html");
        fs.writeFile(filepath, html, _.bind(function(error) {
            if(!error) logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
            cbPageWritten(error);
        },this));
    },this));
};
