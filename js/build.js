var _ = require("underscore");
var async = require("async");
var fs = require("fs.extra");
var handlebars = require("handlebars");
var log = require("./logger");
var mdRenderer = require("./mdRenderer");
var path = require("path");
var utils = require("./utils");

var config = require("../js/config.js");

var pageTemplate;

/*
* Generates the site files, and saves locally
*/
module.exports = function build(cbBuilt) {
    async.series([
        cacheTemplate,
        cleanOutput,
        writePages,
        copyFiles
    ], cbBuilt);
};

// save main page template file
function cacheTemplate(cbTemplateLoaded) {
    fs.readFile(path.join(config._TEMPLATES_DIR, "page.html"), "utf-8", function onRead(error, htmlContents) {
        if(error) return cbTemplateLoaded(error);
        pageTemplate = htmlContents;
        cbTemplateLoaded();
    });
};

// delete everything in _OUTPUT_DIR
function cleanOutput(cbCleaned) {
    fs.rmrf(config._OUTPUT_DIR, function removed(error) {
        fs.mkdir(config._OUTPUT_DIR, cbCleaned);
    });
};

// copy files/folders in _SRC_DIR not prefixed with _
function copyFiles(cbCopiedFiles) {
    fs.readdir(config._SRC_DIR, function read(error, files) {
        if(error) return cbCopiedFiles(error);
        async.each(files, function iterator(file, cbDoneLoop) {
            var isDir = fs.statSync(path.join(config._SRC_DIR, file)).isDirectory();
            if(isDir && file[0] !== '_') {
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), cbDoneLoop);
            } else if(file === "_root") {
                // TODO remove this dirty, dirty code
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR), cbDoneLoop);
            } else  {
                cbDoneLoop();
            }
        }, cbCopiedFiles);
    });
};

function writePages(cbPagesWritten) {
    async.each(Object.keys(config.pages), function iterator(page, cbDoneLoop) {

        getPageData(page, function(error, pageData) {
            if(error) return cbDoneLoop(error);

            // split up pages if paginating
            if(pageData.modelData.paginate) {
                var pagedAttr = pageData.modelData[pageData.modelData.paginate.pagedAttr];
                var currPage = -1;
                var totalPages = pageData.modelData.paginate.totalPages = pagedAttr[pagedAttr.length-1].page;
                async.each(pagedAttr, function iterator(item, cbDoneLoop2) {
                    if(item.page !== currPage) {
                        currPage = item.page;
                        writePage(currPage, pageData, cbDoneLoop2);
                    } else {
                        // already written this page, so do nothing
                        cbDoneLoop2();
                    }
                }, cbDoneLoop);
            } else {
                writePage(1, pageData, cbDoneLoop);
            }
        });
    }, cbPagesWritten);
};

function getPageData(name, cbGotPageData) {
    fs.readFile(path.join(config._TEMPLATES_DIR, config.pages[name].template), "utf-8", function onRead(error, hbsData) {
        if(error) return cbGotPageData(error);

        getModel(name, function(error, modelData) {
            if(error) return cbGotPageData(error);
            cbGotPageData(null, { hbsData: hbsData, modelData: modelData });
        });
    });
};

function writePage(pageNo, pageData, cbPageWritten) {
    // set the page no
    pageData.modelData.page = pageNo;

    var template = handlebars.compile(pageTemplate.replace("[PAGE_CONTENT]", pageData.hbsData));
    var html = template(pageData.modelData);
    // work out the output path
    var nameDir = (pageData.modelData.subDir === true) ? pageData.modelData.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    if(pageDir !== "") pageData.modelData.filePrefix = "../" + pageData.modelData.filePrefix;
    var outputDir = path.join(config._OUTPUT_DIR, nameDir);
    // make all dirs
    fs.mkdirp(path.join(outputDir, pageDir), function onMkdir(error) {
        if (error) return cbPageWritten(error);
        fs.writeFile(path.join(outputDir, pageDir, "index.html"), html, cbPageWritten);
    });
};

function getModel(name, cbGotModel) {
    var model = {};
    // give access to extra settings from config.json (globals and pages)
    for(var key in config.globals) model[key] = config.globals[key];
    for(var key in config.pages[name]) model[key] = config.pages[name][key];
    // common data
    model.id = name;
    model.filePrefix = (config.pages[name].subDir === true ? "../" : "");

    // TODO add a config to denote page/not page
    // TODO something more flexible than "blog" (to match paginate)
    // TODO also add config.js for dynamic navbar (i.e. buttons based on each page)
    switch(name) {
        case "blog":
            getBlogPosts(name, function gotPosts(error, posts) {
                model.posts = posts;
                cbGotModel(null, model);
            });
            break;
        default:
            getPageContent(name, function gotContent(error, body) {
                model.body = body;
                cbGotModel(null, model);
            });
    }
};

function getPageContent(name, cbGotPageContent) {
    fs.readFile(path.join(config._PAGES_DIR, name + ".md"), "utf-8", function onRead(error, mdData) {
        if(error) return cbGotPageContent(error);
        cbGotPageContent(null, mdRenderer(mdData));
    });
};

function getBlogPosts(name, cbGotPosts) {
    // get list of post files
    fs.readdir(config._POSTS_DIR, function onRead(error, files) {
        if(error) return cbGotPosts(error);
        var posts = [];
        // load each blog .md file
        async.forEachOf(files, function iterator(file, index, cbDoneLoop) {
            // ignore hidden files
            if(file[0] === ".") return cbDoneLoop();
            fs.readFile(path.join(config._POSTS_DIR, file), "utf-8", function onRead(error, mdData) {
                if(error) return cbGotPosts(error);

                var postData = {};
                // store metadata
                var metaReg = /(\[!META(\{.*\})\])/;;
                var metaData = JSON.parse(mdData.match(metaReg)[2]);
                for(var key in metaData) postData[key] = metaData[key];
                // format data
                if(metaData.published) metaData.published = new Date(metaData.published);
                postData.body = mdRenderer(mdData.replace(metaReg, ""));

                posts.push(postData);
                cbDoneLoop();
            });
        }, function doneLoop() {
            // organise: (reverse chronological, add page no. to post data)
            posts.sort(function(a,b) { return (a.published < b.published) ? 1 : -1; });

            var conf = config.pages[name];
            for (var i = 0, len = posts.length; i < len; i++) {
                if(conf.paginate) posts[i].page = Math.floor(i/conf.paginate.pageSize)+1;
                else posts[i].page = 1;
            }
            cbGotPosts(null, posts);
        });
    });
};

/**
* handlebars helpers
*/
handlebars.registerHelper("log", function(value) {
    log(value);
});

handlebars.registerHelper("dateFormat", function(value) {
    return utils.formatDate(value, "DD/MM/YYYY");
});

handlebars.registerHelper("lowerCase", function(value) {
    if(value) return value.toLowerCase();
});

handlebars.registerHelper("newerPageLink", function(value) {
    var no = value-1;
    return "/blog" + (no == 1 ? "" : "/page" + no);
});

handlebars.registerHelper("olderPageLink", function(value) {
    return "/blog/page" + (++value);
});

handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) return options.fn(this);
    return options.inverse(this);
});
