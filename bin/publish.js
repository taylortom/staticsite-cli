var _ = require("underscore");
var async = require("async");
var fs = require("fs");
var handlebars = require("handlebars");
var log = require("../js/logger");
var marked = require("marked");
var nodegit = require("nodegit");
var path = require("path");
var Q = require("q");

var config = require("../config/config.json");

/*
* Updates the website on GitHub
*/
module.exports = function publish(options) {
    log("publishing website...");

    var TEMPLATES_DIR = path.join(path.dirname(require.main.filename), "tmp", "templates");
    var pageTemplate;

    // load main page template file and render pages
    fs.readFile(path.join(TEMPLATES_DIR, "page.html"), "utf-8", function(error, htmlContents) {
        if(error) return console.log(error);

        pageTemplate = htmlContents;

        async.each(Object.keys(config.pages), function iterator(page, callback) {
            renderPage(page, function(error) {
                if(error) console.log(error);
                callback();
            });
        }, function done() {
            console.log("rendered");
        });
    });

    function renderPage(name, callback) {
        fs.readFile(path.join(TEMPLATES_DIR, config.pages[name].template), "utf-8", function(error, hbsData) {
            if(error) return console.log(error);

            getModel(name, function(error, modelData) {
                if(error) return console.log(error);

                var template = handlebars.compile(pageTemplate.replace("{{{pageContent}}}", hbsData));
                var html = template(modelData);

                var outputPath = path.join("tmp", "website", (config.pages[name].subDir === true) ? path.join(name, "index.html") : "index.html");
                fs.writeFile(outputPath, html, function(error) {
                    if(error) return console.log(error);
                    callback();
                });
            })
        });
    };

    function getModel(name, callback) {
        var model = {
            title: config.pages[name].title,
            filePrefix: (config.pages[name].subDir === true ? "../" : "")
        };

        switch(name) {
            case "blog":
                getBlogPosts(function(error, data) {
                    model.posts = data;
                    callback(null, model);
                });
                break;
            default:
                // nothing to do
                callback(null, model);
        };
    };

    function getBlogPosts(callback) {
        var POSTS_DIR = path.join(path.dirname(require.main.filename), "tmp", "blog", "published");
        var posts = [];

        fs.readdir(POSTS_DIR, function onRead(error, files) {
            if(error) return console.log(error);

            // load each blog .md file
            async.each(files, function(file, done) {
                fs.readFile(path.join(POSTS_DIR, file), "utf-8", function(error, mdData) {
                    if(error) return console.log(error);

                    posts.push(formatPostHTML(mdData));
                    done();
                });
            },
            function done() {
                callback(null, posts);
            });
        });
    };

    function formatPostHTML(mdData) {
        var metaReg = /(!META\{.*})/;
        var metaData = JSON.parse(mdData.match(metaReg)[0].slice(5));
        var converted = marked(mdData.replace(metaReg, ""), {
            renderer: renderer,
            gfm: true,
            breaks: true
        });
        var template = handlebars.compile(converted);
        return template(metaData);
    };

    /**
    * Marked renderer overrides
    */
    var renderer = new marked.Renderer();

    renderer.heading = function(text, level) {
        return '<div class="source_code"><span class="command">$ ' + text + '</span><span class="published">{{published}}</span></div>';
    };

    renderer.code = function(text) {
        return '<div class="source_code">' + text + '</div>';
    };
};
