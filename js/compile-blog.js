var _ = require("underscore");
var async = require("async");
var fs = require("fs.extra");
var handlebars = require("handlebars");
var path = require("path");

var Page = require("./compile-page");
var config = require("../js/config");
var logger = require("../js/logger");
var mdRenderer = require("../js/mdRenderer");
var utils = require("../js/utils");

var Blog = module.exports = function(id, data) {
    Page.call(this, id, data);
    this.type = "blog";
};

Blog.prototype = Object.create(Page.prototype);
Blog.prototype.contructor = Blog;

// load all .md posts
Blog.prototype.getPosts = function(cbGotPosts) {
    fs.readdir(config._POSTS_DIR, _.bind(function onRead(error, files) {
        if(error) return cbGotPosts(error);
        var posts = [];
        async.forEachOf(utils.fileFilter(files, { type: ".md" }), _.bind(function iterator(file, index, cbDoneLoop) {
            fs.readFile(path.join(config._POSTS_DIR, file), "utf-8", _.bind(function onRead(error, mdData) {
                if(error) return cbGotPosts(error);

                var postData = {};

                try {
                    this.parseMetaData(mdData, postData);
                }
                catch(e) {
                    console.log(e);
                    logger.warn("Skipping " + logger.file(file) + ", invalid metadata");
                }

                postData.body = mdRenderer(mdData.replace(/.*}]/, ""));
                posts.push(postData);

                cbDoneLoop();
            }, this));
        }, this), _.bind(function doneLoop() {
            // organise: (reverse chronological, add page no. to post data)
            posts.sort(function(a,b) { return (a.published < b.published) ? 1 : -1; });

            var conf = config.pages.blog;
            for (var i = 0, len = posts.length; i < len; i++) {
                posts[i].page = (conf.paginate) ? Math.floor(i/conf.paginate.pageSize)+1 : 1;
            }
            this.posts = posts;
            cbGotPosts();
        }, this));
    }, this));
};

Blog.prototype.getTagData = function(cbGotTagData) {
    var sorted = {};
    async.each(this.posts, _.bind(function iterator(post, cbDoneLoop) {
        async.each(post.tags, _.bind(function iterator(tag, cbDoneLoop2) {
            if(!sorted[tag]) sorted[tag] = [ post ];
            else sorted[tag].push(post);
            cbDoneLoop2();
        },this), cbDoneLoop);
    },this), function(error) {
        cbGotTagData(error, sorted);
    });
};

Blog.prototype.parseMetaData = function(mdData, postData) {
    var metaReg = /(\[!META(\{.*\})\])/;
    var metaData = JSON.parse(mdData.match(metaReg)[2]);
    for(var key in metaData) postData[key] = metaData[key];

    postData.published = new Date(metaData.published);

    // add folder location for permalinks and writing posts later
    var datePrefix = utils.formatDate(postData.published, "YYYY/MM/DD").replace(/\//g,path.sep);
    postData.dir = path.join(datePrefix, postData.id + path.sep);
};

Blog.prototype.writePosts = function(cbPostsWritten) {
    var template = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", this.templateData.pages.post));
    async.each(this.posts, _.bind(function iterator(post, cbDoneLoop) {
        var html = template({
            pageModel: this,
            postModel: post
        });
        var outputDir = path.join(config._OUTPUT_DIR, this.rootDir, post.dir);
        fs.mkdirp(outputDir, _.bind(function onMkdir(error) {
            if (error) return cbDoneLoop(error);
            fs.writeFile(path.join(outputDir, "index.html"), html, _.bind(function(error) {
                if(error) return cbDoneLoop(error);
                logger.debug("Created " + logger.file(path.join(outputDir.replace(config._OUTPUT_DIR + path.sep, ""), "index.html")));
                return cbDoneLoop();
            },this));
        }, this));
    },this), cbPostsWritten);
};

Blog.prototype.writeTags = function(cbTagsWritten) {
    var template = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", this.templateData.pages.tags));
    this.getTagData(_.bind(function(error, tagData) {
        async.forEachOf(tagData, _.bind(function iterator(tag, key, cbDone) {
            var html = template({
                pageModel: this,
                tagData: tag
            });
            var outputDir = path.join(config._OUTPUT_DIR, this.rootDir, key);
            fs.mkdirp(outputDir, _.bind(function onMkdir(error) {
                if (error) return cbDone(error);
                fs.writeFile(path.join(outputDir, "index.html"), html, _.bind(function(error) {
                    if(error) return cbDone(error);
                    logger.debug("Created " + logger.file(path.join(outputDir.replace(config._OUTPUT_DIR + path.sep, ""), "index.html")));
                    cbDone();
                },this));
            }, this));
        }, this), cbTagsWritten);
    },this));
};

/*
* OVERRIDES START HERE...
*/

Blog.prototype.loadData = function(cbDataLoaded) {
    Page.prototype.loadData.call(this, _.bind(function loadedData(error) {
        if(error) return cbDataLoaded(error);
        this.rootDir = path.sep + this.id;
        this.getPosts(cbDataLoaded);
    }, this));
};

Blog.prototype.writeSubPages = function(cbPageWritten) {
    async.parallel([
        _.bind(this.writeTags, this),
        _.bind(this.writePosts, this)
    ], cbPageWritten);
};
