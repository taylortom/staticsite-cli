var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var handlebars = require("handlebars");
var log = require("../js/logger");
var marked = require("marked");
var path = require("path");

var config = require("../js/config.js");

/*
* Updates the website on GitHub
*/
module.exports = function publish(options) {
    log("publishing website...");

    var pageTemplate;

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
            if(error) return log(error);

            getModel(name, function(error, modelData) {
                if(error) return log(error);

                var template = handlebars.compile(pageTemplate.replace("{{{pageContent}}}", hbsData));
                var html = template(modelData);

                var outputPath = path.join(config._OUTPUT_DIR, (config.pages[name].subDir === true) ? path.join(name, "index.html") : "index.html");
                fs.writeFile(outputPath, html, function(error) {
                    if(error) return log(error);
                    callback();
                });
            })
        });
    };

    function getModel(name, callback) {
        // common data
        var model = {};
        model.id = name;
        model.filePrefix = (config.pages[name].subDir === true ? "../" : "");

        // give access to all page config settings in case
        for(var key in config.pages[name]) {
            model[key] = config.pages[name][key];
        }

        // TODO add a config to denote page/not page
        switch(name) {
            case "blog":
                getBlogPosts("published", function(error, data) {
                    model.posts = data;
                    callback(null, model);
                });
                break;
            default:
                getPage(name, function(error, data) {
                    model.body = data;
                    callback(null, model);
                });
        };
    };

    function getPage(name, callback) {
        fs.readFile(path.join(config._PAGES_DIR, name + ".md"), "utf-8", function(error, mdData) {
            if(error) return log(error);

            callback(null, marked(mdData, { renderer: blogRenderer }));
        });
    };

    function getBlogPosts(type, callback) {
        var postsDir = path.join(config._POSTS_DIR, type);
        var posts = [];

        fs.readdir(postsDir, function onRead(error, files) {
            if(error) return log(error);

            // load each blog .md file
            async.each(files, function(file, done) {
                if(file[0] === ".") return done();
                fs.readFile(path.join(postsDir, file), "utf-8", function(error, mdData) {
                    if(error) return log(error);

                    var postData = {};

                    try {
                        // try and convert to object
                        var metaReg = /(!META\{.*})/;
                        var metaData = JSON.parse(mdData.match(metaReg)[0].slice(5));

                        // copy to postData
                        for(var key in metaData) postData[key] = metaData[key];

                        if(metaData.published) metaData.published = new Date(metaData.published);
                        postData.body = marked(mdData.replace(metaReg, "").replace(metaReg, ""), { renderer: blogRenderer });

                    }
                    catch(e) {
                        // no metadata, nothing to do
                        postData.body = mdData;
                    }

                    posts.push(postData);
                    done();
                });
            },
            function done() {
                // sort and return
                posts.sort(function(a,b) { return a.published < b.published; });
                callback(null, posts);
            });
        });
    };

    /**
    * Marked renderer overrides
    * TODO: add these to templates
    */
    var blogRenderer = new marked.Renderer();

    blogRenderer.heading = function(text, level) {
        return '<div class="heading h' + level + '">' + text + '</div>';
    };

    blogRenderer.code = function(value) {
        return '<div class="source_code" style="white-space: pre-wrap;">' + value + '</div>';
    };

    blogRenderer.codespan = function(value) {
        return '<span class="source_code inline">' + value + '</span>';
    };

    blogRenderer.blockquote = function(value) {
        return '<div class="blockquote">' + value + '</div>';
    };

    blogRenderer.image = function(href, title, alt) {
        return "<img class='media' title='" + title + "' alt='" + alt + "' src='" + href.replace("file://", "media/") + "' />";
    };

    blogRenderer.html = function(value) {
        if(value.substr(1,7) === "youtube") {
            return "<iframe class='media' width='480' height='320' src='https://www.youtube.com/embed/" + value.match(/video-id="(.*)"/)[1] + "?rel=0&amp;showinfo=0' allowfullscreen></iframe>";
        }
        return value;
    };

    /**
    * handlebars helpers
    */
    handlebars.registerHelper("log", function(value) {
        log(value);
    });

    handlebars.registerHelper("dateFormat", function(value) {
        value = new Date(value);
        return value.getDate() + "/" + (value.getMonth()+1) + "/" + value.getFullYear();
    });

    handlebars.registerHelper("lowerCase", function(value) {
        if(value) return value.toLowerCase();
    });
};
