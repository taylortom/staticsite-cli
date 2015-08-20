var _ = require("underscore");
var async = require("async");
var fs = require("fs.extra");
var handlebars = require("handlebars");
var mdRenderer = require("../js/mdRenderer");
var path = require("path");

var config = require("../js/config");
var logger = require("../js/logger");
var utils = require("../js/utils");

var htmlTemplate;
var pagesData = {};

// TODO split this into separate files per page

/*
* Generates the site files, and saves locally
*/

// prepare
// build
// save
module.exports = function build(args, cbBuilt) {
    logger.task("Preparing output");
    async.series([
        getPagesData,
        cacheTemplate,
        cleanOutput
    ], function(error) {
        if(error) return cbBuilt(error);
        logger.task("Building output");
        async.parallel([
            writePages,
            writePosts,
            copyFiles
        ], cbBuilt);
    });
};

// save main page template file
function cacheTemplate(cbTemplateLoaded) {
    loadTemplate("page.html", function onRead(error, htmlContents) {
        if(error) return cbTemplateLoaded(error);
        logger.debug("Cached HTML template data");
        htmlTemplate = htmlContents
        cbTemplateLoaded();
    });
};

// delete everything in _OUTPUT_DIR
function cleanOutput(cbCleaned) {
    fs.rmrf(config._OUTPUT_DIR, function removed(error) {
        fs.mkdir(config._OUTPUT_DIR, function(error) {
            if(!error) logger.debug("Cleaned output directory");
            cbCleaned(error);
        });
    });
};

// copy files/folders in _SRC_DIR not prefixed with _
function copyFiles(cbCopiedFiles) {
    fs.readdir(config._SRC_DIR, function read(error, files) {
        if(error) return cbCopiedFiles(error);
        async.each(files, function iterator(file, cbDoneLoop) {
            var isDir = fs.statSync(path.join(config._SRC_DIR, file)).isDirectory();
            if(isDir && file[0] !== '_' && file[0] !== '.') {
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR, file), function(error) {
                    if(error) return cbCopiedFiles(error);
                    logger.debug("Copied " + file);
                    cbDoneLoop();
                });
            } else if(file === "_root") { // TODO remove this dirty, dirty check
                fs.copyRecursive(path.join(config._SRC_DIR, file), path.join(config._OUTPUT_DIR), function(error) {
                    if(error) return cbCopiedFiles(error);
                    logger.debug("Copied " + file);
                    cbDoneLoop();
                });
            } else  {
                return cbDoneLoop();
            }
        }, cbCopiedFiles);
    });
};

function getPagesData(cbGotPagesData) {
    async.each(Object.keys(config.pages), function iterator(page, cbDoneLoop) {
        var model = {};
        // give access to extra settings from config.json (globals and pages)
        for(var key in config.globals) model[key] = config.globals[key];
        for(var key in config.pages[page]) model[key] = config.pages[page][key];
        // common data
        model.id = page;
        // hbs template
        loadTemplate(config.pages[page].template, function(error, hbsData) {
            if(error) return cbDoneLoop(error);
            model.templates = {
                page: hbsData
            };
        });
        // TODO add a config to denote page/not page
        // TODO something more flexible than "blog" (to match paginate)
        // TODO also add config.js for dynamic navbar (i.e. buttons based on each page)
        switch(page) {
            case "blog":
                async.parallel([
                    getBlogPosts,
                    function(done) {
                        loadTemplate("post.hbs", done);
                    }
                ], function(error, results) {
                    if(error) return cbDoneLoop(error);
                    logger.debug("Got " + logger.var(page) + " page data");

                    model.posts = results[0];
                    model.templates.post = results[1];
                    pagesData[page] = model;

                    cbDoneLoop(null);
                });
                break;
            default:
                getPageContent(page, function gotContent(error, body) {
                    if(error) return cbDoneLoop(error);
                    logger.debug("Got " + logger.var(page) + " page data");

                    model.body = body;
                    pagesData[page] = model;

                    cbDoneLoop(null);
                });
                break;
        }
    }, cbGotPagesData);
};

function writePages(cbPagesWritten) {
    async.each(Object.keys(config.pages), function iterator(page, cbDoneLoop) {
        var pageData = pagesData[page];
        // split up pages if paginating
        if(pageData.paginate) {
            var pagedAttr = pageData[pageData.paginate.pagedAttr];
            var currPage = -1;
            var totalPages = pageData.paginate.totalPages = pagedAttr[pagedAttr.length-1].page;
            async.each(pagedAttr, function iterator(item, cbDoneLoop2) {
                if(item.page !== currPage) {
                    currPage = item.page;
                    writePage(currPage, pageData, function(error) {
                        if(error) return cbPageWritten(error);
                        cbDoneLoop2();
                    });
                } else cbDoneLoop2();
            }, cbDoneLoop);
        } else {
            writePage(1, pageData, function pageWritten(error) {
                if(error) return cbPagesWritten(error);
                cbDoneLoop();
            });
        }
    }, cbPagesWritten);
};

function writePage(pageNo, pageData, cbPageWritten) {
    // work out the output path
    var nameDir = (pageData.subDir === true) ? pageData.id : "";
    var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
    var outputDir = path.join(config._OUTPUT_DIR, nameDir, pageDir);

    var template = handlebars.compile(htmlTemplate.replace("[PAGE_CONTENT]", pageData.templates.page));
    var html = template({
        pageModel: pageData,
        page: pageNo
    });
    // make all dirs
    fs.mkdirp(outputDir, function onMkdir(error) {
        if (error) return cbPageWritten(error);
        var filepath = path.join(outputDir, pageData.index || "index.html");
        fs.writeFile(filepath, html, function(error) {
            if(!error) logger.debug("Created " + logger.file(filepath.replace(config._OUTPUT_DIR + path.sep,"")));
            cbPageWritten(error);
        });
    });
};

// maybe fo this in some more clever way...
function writePosts(cbPostsWritten) {
    var page = "blog";
    var pageData = pagesData[page];
    var template = handlebars.compile(htmlTemplate.replace("[PAGE_CONTENT]", pageData.templates.post));

    async.each(pageData.posts, function iterator(post, cbDoneLoop) {
        var html = template({
            pageModel: pageData,
            postModel: post
        });
        var outputDir = path.join(config._OUTPUT_DIR, post.dir);
        // make all dirs
        fs.mkdirp(outputDir, function onMkdir(error) {
            if (error) return cbPostsWritten(error);
            fs.writeFile(path.join(outputDir, "index.html"), html, function(error) {
                if(error) return cbPostsWritten(error);
                logger.debug("Created " + logger.file(path.join(outputDir.replace(config._OUTPUT_DIR + path.sep, ""), "index.html")));
                return cbDoneLoop();
            });
        });
    }, cbPostsWritten);
}

function getPageContent(name, cbGotPageContent) {
    fs.readFile(path.join(config._PAGES_DIR, name + ".md"), "utf-8", function onRead(error, mdData) {
        if(error) return cbGotPageContent(error);
        cbGotPageContent(null, mdRenderer(mdData));
    });
};

function getBlogPosts(cbGotPosts) {
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
                var metaReg = /(\[!META(\{.*\})\])/;
                try { var metaData = JSON.parse(mdData.match(metaReg)[2]); }
                catch(e) { logger.warn("Skipping " + logger.file(file) + ", invalid metadata"); }
                for(var key in metaData) postData[key] = metaData[key];

                // format data
                metaData.published = new Date(metaData.published);

                // add folder location for permalinks and writing posts later
                var datePrefix = utils.formatDate(postData.published, "YYYY/MM/DD").replace(/\//g,path.sep);
                postData.dir = path.join("blog", datePrefix, postData.id + path.sep);
                postData.permalink = config.server.url + "/" + postData.dir.replace(path.sep,"/");

                postData.body = mdRenderer(mdData.replace(metaReg, ""));

                posts.push(postData);
                cbDoneLoop();
            });
        }, function doneLoop() {
            // organise: (reverse chronological, add page no. to post data)
            posts.sort(function(a,b) { return (a.published < b.published) ? 1 : -1; });

            var conf = config.pages.blog;
            for (var i = 0, len = posts.length; i < len; i++) {
                posts[i].page = (conf.paginate) ? Math.floor(i/conf.paginate.pageSize)+1 : 1;
            }
            cbGotPosts(null, posts);
        });
    });
};

/*
* Helper functions
*/

function loadTemplate(filename, cbTemplateLoaded) {
    fs.readFile(path.join(config._TEMPLATES_DIR, filename), "utf-8", cbTemplateLoaded);
};

/**
* handlebars
*/
handlebars.registerHelper("log", function(value) {
    logger.log(value);
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
