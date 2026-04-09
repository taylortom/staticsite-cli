import config from '../js/config.js';
import fs from 'fs/promises';
import logger from '../js/logger.js';
import mdRenderer from '../js/mdRenderer.js';
import Page from './compile-page.js';
import path from 'path';
import utils from '../js/utils.js';

var Blog = function(id, data, args) {
  Page.call(this, id, data);
  this.type = "blog";
  this.includeDrafts = args.drafts || args.d;
};

Blog.prototype = Object.create(Page.prototype);
Blog.prototype.contructor = Blog;

// load all .md posts
Blog.prototype.getPosts = async function(dir) {
  const files = await fs.readdir(dir);
  if(files.length === 0) return [];

  var posts = [];
  for (const file of utils.fileFilter(files, { type: ".md" })) {
    const mdData = await fs.readFile(path.join(dir, file), 'utf-8');
    try {
      var postData = {};
      this.parseMetaData(mdData, postData);
      postData.body = mdRenderer(mdData.replace(/.*}]/, ""));
      posts.push(postData);
    } catch(e) {
      logger.warn("Skipping " + logger.file(file) + ", invalid metadata (" + e + ")");
    }
  }
  return posts;
};

// sorts and assigns page numbers
Blog.prototype.organisePosts = function() {
  if(!this.posts || this.posts.length < 2) return;
  // reverse chronological
  this.posts.sort(function(a,b) { return (a.published < b.published) ? 1 : -1; });

  var conf = config.pages.blog;
  for (var i = 0, len = this.posts.length; i < len; i++) {
    this.posts[i].page = (conf.paginate) ? Math.floor(i/conf.paginate.pageSize)+1 : 1;
  }
};

Blog.prototype.getTagData = function() {
  var sorted = {};
  for (const post of this.posts) {
    for (const tag of post.tags) {
      if(!sorted[tag]) sorted[tag] = [ post ];
      else sorted[tag].push(post);
    }
  }
  return sorted;
};

Blog.prototype.parseMetaData = function(mdData, postData) {
  var metaReg = /(\[!META(\{.*\})\])/;
  var metaData = JSON.parse(mdData.match(metaReg)[2]);
  for(var key in metaData) postData[key] = metaData[key];

  for (const field of ['id','title','published','tags']) {
    if(!metaData.hasOwnProperty(field)) throw new Error('Missing ' + field);
  }
  postData.published = new Date(metaData.published);
  var datePrefix = utils.formatDate(postData.published, "YYYY/MM/DD").replace(/\//g,path.sep);
  // add folder location for permalinks and writing posts later
  postData.dir = path.join(datePrefix, postData.id + path.sep);
};

Page.prototype.writeArchive = async function() {
  var model = this.getModel({
    title: {
      text: this.pages.archive.title,
      show: true
    },
    description: this.pages.archive.description
  });
  var outputDir = path.join(config._OUTPUT_DIR, this.rootDir, "archive");
  await this.writePage(model, this.templateData.pages.archive, "index.html", outputDir);
};

Blog.prototype.writePosts = async function() {
  for (const post of this.posts) {
    var model = this.getModel({ postModel: post });
    var outputDir = path.join(config._OUTPUT_DIR, this.rootDir, post.dir);
    await this.writePage(model, this.templateData.pages.posts, "index.html", outputDir);
  }
};

Blog.prototype.writeTags = async function() {
  const tagData = this.getTagData();
  for (const [key, tag] of Object.entries(tagData)) {
    var model = this.getModel({
      title: {
        text: this.pages.tags.title.replace("[TAG]", key),
        show: true
      },
      tagData: tag
    });
    var outputDir = path.join(config._OUTPUT_DIR, this.rootDir, key);
    await this.writePage(model, this.templateData.pages.tags, "index.html", outputDir);
  }
};

Blog.prototype.writeFeed = async function() {
  var noOfpages = Math.ceil(this.posts.length/this.feed.pageSize);
  for (let i = 0; i < noOfpages; i++) {
    await this.writeFeedPage(i);
  }
  logger.debug("JSON blog Feed created");
};

Blog.prototype.writeFeedPage = async function(pageNo) {
  var pageUrl = `${config.server.url}${this.rootDir}`;
  var postPageData = this.getFeedPostData(pageNo);
  var feed = {
    version: "https://jsonfeed.org/version/1",
    title: this.feed.title,
    home_page_url: pageUrl,
    feed_url: `${pageUrl}/feed.json`,
    description: this.feed.description,
    icon: this.feed.icon,
    author: {
      name: this.feed.author.name,
      url: config.server.url,
      avatar: this.feed.author.avatar
    },
    items: postPageData.posts
  };
  if(postPageData.nextPage) {
    feed.next_url = `${pageUrl}/${postPageData.nextPage}`;
  }
  var filename = 'feed' + ((pageNo > 0) ? pageNo : '') + '.json';
  await fs.writeFile(path.join(config._OUTPUT_DIR, this.rootDir, filename), JSON.stringify(feed));
};

Blog.prototype.getFeedPostData = function(pageNo) {
  var startIndex = this.feed.pageSize*pageNo;
  var endIndex = startIndex+this.feed.pageSize;
  var posts = this.posts.slice(startIndex, endIndex).map(post => {
    return {
      id: post.id,
      url: `${config.server.url}${this.rootDir}/${post.dir}`,
      title: post.title,
      content_html: post.body,
      content_text: post.body.replace(/<[^>]*>/g, ''),
      // TODO support summary
      // summary: post.summary,
      date_published: post.published,
      tags: post.tags
    };
  });
  return {
    posts: posts,
    nextPage: (endIndex < this.posts.length) ? `feed${++pageNo}.json` : ''
  }
};

/*
* OVERRIDES START HERE...
*/

Blog.prototype.loadData = async function() {
  await Page.prototype.loadData.call(this);
  this.rootDir = path.sep + this.id;
  this.posts = [];

  const postData = await this.getPosts(config._POSTS_DIR);
  this.posts = this.posts.concat(postData);

  if(this.includeDrafts) {
    const draftData = await this.getPosts(config._DRAFTS_DIR);
    this.posts = this.posts.concat(draftData);
  }
  this.organisePosts();
};

Blog.prototype.write = async function() {
  await Page.prototype.write.call(this);
  await this.writeFeed();
};

export default Blog;
