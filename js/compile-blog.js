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

Blog.prototype.parseMetaData = function(mdData, postData) {
    var metaReg = /(\[!META(\{.*\})\])/;
    var metaData = JSON.parse(mdData.match(metaReg)[2]);
    for(var key in metaData) postData[key] = metaData[key];

    postData.published = new Date(metaData.published);

    // add folder location for permalinks and writing posts later
    var datePrefix = utils.formatDate(postData.published, "YYYY/MM/DD").replace(/\//g,path.sep);
    postData.dir = path.join("blog", datePrefix, postData.id + path.sep);
    postData.permalink = config.server.url + "/" + postData.dir.replace(path.sep,"/");
};

Blog.prototype.writePosts = function(cbPostsWritten) {
    var template = handlebars.compile(this.templateData.containerPage.replace("[PAGE_CONTENT]", this.templateData.post));

    async.each(this.posts, _.bind(function iterator(post, cbDoneLoop) {
        var html = template({
            pageModel: this,
            postModel: post
        });
        var outputDir = path.join(config._OUTPUT_DIR, post.dir);
        fs.mkdirp(outputDir, _.bind(function onMkdir(error) {
            if (error) return cbPostsWritten(error);
            fs.writeFile(path.join(outputDir, "index.html"), html, _.bind(function(error) {
                if(error) return cbPostsWritten(error);
                logger.debug("Created " + logger.file(path.join(outputDir.replace(config._OUTPUT_DIR + path.sep, ""), "index.html")));
                return cbDoneLoop();
            },this));
        }, this));

    },this), cbPostsWritten);
};

/*
* OVERRIDES START HERE...
*/

Blog.prototype.loadData = function(cbDataLoaded) {
    Page.prototype.loadData.call(this, _.bind(function loadedData(error) {
        if(error) return cbDataLoaded(error);
        this.getPosts(cbDataLoaded);
    }, this));
};

Blog.prototype.loadTemplates = function(cbTemplateLoaded) {
    Page.prototype.loadTemplates.call(this, _.bind(function loadedTemplates(error) {
        if(error) return cbTemplateLoaded(error);

        this.loadTextFile(path.join(config._TEMPLATES_DIR, this.templates.post), function fileRead(error, data) {
            this.templateData.post = data;
            cbTemplateLoaded(error);
        });
    }, this));
};

Blog.prototype.write = function(cbWritten) {
    Page.prototype.write.call(this, _.bind(function written(error) {
        if(error) return cbWritten(error);
        this.writePosts(cbWritten);
    }, this));
};
