var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var handlebars = require("handlebars");
var log = require("../js/logger");
var mdRenderer = require("../js/mdRenderer");
var path = require("path");
var utils = require("../js/utils");

var config = require("../js/config.js");

/*
* Combines the following:
* TODO build: create pages
* TODO save: push to git
* TODO output: FTP to web server
*/
module.exports = function publish(options) {
    log("publishing website...");

    var pageTemplate;

    // TODO clear out pagination folders

    // load main page template file and render pages
    fs.readFile(path.join(config._TEMPLATES_DIR, "page.html"), "utf-8", function(error, htmlContents) {
        if(error) return log(error);

        pageTemplate = htmlContents;

        // TODO make this a single page app
        async.each(Object.keys(config.pages), function iterator(page, callback) {
            renderPage(page, function(error) {
                if(error) log(error);
                callback();
            });
        }, function done() {
            log("rendered");
            // TODO copy assets to website
            // TODO commit, push to github
        });
    });

    function renderPage(name, callback) {
        fs.readFile(path.join(config._TEMPLATES_DIR, config.pages[name].template), "utf-8", function(error, hbsData) {
            if(error) return callback(error);

                getModel(name, function(error, modelData) {
                    if(error) return callback(error);

                    // TODO get rid of this nested function
                    function writePage(pageNo, done) {
                        // set the page no
                        modelData.page = pageNo;

                        var template = handlebars.compile(pageTemplate.replace("[PAGE_CONTENT]", hbsData));
                        var html = template(modelData);

                        // work out the output path
                        var nameDir = (modelData.subDir === true) ? name : "";
                        var pageDir = (pageNo > 1) ? "page" + (pageNo) : "";
                        if(pageDir !== "") modelData.filePrefix = "../" + modelData.filePrefix;
                        var outputDir = path.join(config._OUTPUT_DIR, nameDir);

                        // TODO cba with async here...
                        if(!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
                        if(!fs.existsSync(path.join(outputDir, pageDir))) fs.mkdirSync(path.join(outputDir, pageDir));

                        fs.writeFile(path.join(outputDir, pageDir, "index.html"), html, done);
                    };

                    // create page files
                    if(modelData.paginate) {
                        var pagedAttr = modelData[modelData.paginate.pagedAttr];
                        var currPage = -1;
                        var totalPages = pagedAttr[pagedAttr.length-1].page;

                        modelData.paginate.totalPages = totalPages;

                        async.each(pagedAttr, function (item, done) {
                            if(item.page !== currPage) {
                                currPage = item.page;
                                writePage(currPage, done);
                            } else done();
                        }, callback);
                    } else {
                        writePage(1, callback);
                    }
                });
        });
    };

    function getModel(name, callback) {
        var model = {};

        // give access to extra settings from config.json (globals and pages)
        for(var key in config.globals) model[key] = config.globals[key];
        for(var key in config.pages[name]) model[key] = config.pages[name][key];

        // common data
        model.id = name;
        model.filePrefix = (config.pages[name].subDir === true ? "../" : "");

        // TODO add a config to denote page/not page
        // TODO something more flexible than "blog" (to match paginate)
        // TODO also add config.js, for dynamic navbar
        switch(name) {
            case "blog":
                getBlogPosts(name, function(error, data) {
                    model.posts = data;
                    callback(null, model);
                });
                break;
            default:
                getPage(name, function(error, data) {
                    model.body = data;
                    callback(null, model);
                });
        }
    };

    function getPage(name, callback) {
        fs.readFile(path.join(config._PAGES_DIR, name + ".md"), "utf-8", function(error, mdData) {
            if(error) return log(error);

            callback(null, mdRenderer(mdData));
        });
    };

    function getBlogPosts(name, callback) {
        var posts = [];

        fs.readdir(config._POSTS_DIR, function onRead(error, files) {
            if(error) return log(error);

            // load each blog .md file
            async.forEachOf(files, function iterator(file, index, done) {
                if(file[0] === ".") return done();
                fs.readFile(path.join(config._POSTS_DIR, file), "utf-8", function(error, mdData) {
                    if(error) return log(error);

                    var postData = {};

                    try {
                        // try and convert to object
                        var metaReg = /(\[!META(\{.*\})\])/;
                        var metaMatch = mdData.match(metaReg);
                        var metaData = JSON.parse(metaMatch[2]);

                        // copy to postData
                        for(var key in metaData) postData[key] = metaData[key];

                        if(metaData.published) metaData.published = new Date(metaData.published);
                        postData.body = mdRenderer(mdData.replace(metaReg, ""));
                    }
                    catch(e) {
                        // console.log(mdData);
                        // no metadata, nothing to do
                        postData.body = mdData;
                    }

                    posts.push(postData);
                    done();
                });
            },
            function done() {
                // reverse sort
                posts.sort(function(a,b) {
                    return (a.published < b.published) ? 1 : -1;
                });

                // store the page number for pagination
                var conf = config.pages[name];
                for (var i = 0, len = posts.length; i < len; i++) {
                    if(conf.paginate) {
                        posts[i].page = Math.floor(i/conf.paginate.pageSize)+1;
                    } else {
                        posts[i].page = 1;
                    }
                }

                callback(null, posts);
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
};
