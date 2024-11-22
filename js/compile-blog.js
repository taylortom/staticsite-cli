import config from '../js/config.js';
import fs from 'fs/promises';
import h2p from 'html2plaintext';
import logger from '../js/logger.js';
import mdRenderer from '../js/mdRenderer.js';
import Page from './compile-page.js';
import path from 'path';
import utils from '../js/utils.js';

const Blog = function(id, data, args) {
  Page.call(this, id, data);
  this.type = "blog";
  this.includeDrafts = args.drafts || args.d;
};

Blog.prototype = Object.create(Page.prototype);
Blog.prototype.contructor = Blog;

// load all .md posts
Blog.prototype.getPosts = async function(dir) {
  const files = await fs.readdir(dir);
  if(files.length === 0) {
    return;
  }
  const posts = [];
  await Promise.all(utils.fileFilter(files, { type: ".md" }).map(async file => {
    const mdData = await fs.readFile(path.join(dir, file), "utf-8");
    try {
      var postData = {};
      this.parseMetaData(mdData, postData);
      postData.body = mdRenderer(mdData.replace(/.*}]/, ""));
      posts.push(postData);
    } catch(e) {
      logger.warn("Skipping " + logger.file(file) + ", invalid metadata (" + e + ")");
    }
  }));
  return posts;
};

// sorts and assigns page numbers
Blog.prototype.organisePosts = function() {
  if(!this.posts || this.posts.length < 2) return;
  // reverse chronological
  this.posts.sort((a, b) => (a.published < b.published) ? 1 : -1);

  const conf = config.pages.blog;
  for (let i = 0, len = this.posts.length; i < len; i++) {
    this.posts[i].page = (conf.paginate) ? Math.floor(i/conf.paginate.pageSize)+1 : 1;
  }
};

Blog.prototype.getTagData = function() {
  return this.posts.reduce((sorted, post) => {
    sorted[tag] = sorted[tag] ? sorted[tag].concat(post) : [post];
    return sorted;
  }, {});
};

Blog.prototype.parseMetaData = function(mdData, postData) {
  const metaReg = /(\[!META(\{.*\})\])/;
  const metaData = JSON.parse(mdData.match(metaReg)[2]);
  for(let key in metaData) postData[key] = metaData[key];
  // validate

  ['id','title','published','tags'].forEach(field => {
    if(!metaData.hasOwnProperty(field)) throw new Error('Missing ' + field);
  });
  postData.published = new Date(metaData.published);
  const datePrefix = utils.formatDate(postData.published, "YYYY/MM/DD").replace(/\//g,path.sep);
  // add folder location for permalinks and writing posts later
  postData.dir = path.join(datePrefix, postData.id + path.sep);
};

Page.prototype.writeArchive = function() {
  const model = this.getModel({
    title: {
      text: this.pages.archive.title,
      show: true
    },
    description: this.pages.archive.description
  });
  const outputDir = path.join(config._OUTPUT_DIR, this.rootDir, "archive");
  return this.writePage(model, this.templateData.pages.archive, "index.html", outputDir);
};

Blog.prototype.writePosts = function() {
  return Promise.all(this.posts.map(post => {
    const model = this.getModel({ postModel: post });
    const outputDir = path.join(config._OUTPUT_DIR, this.rootDir, post.dir);
    return this.writePage(model, this.templateData.pages.posts, "index.html", outputDir);
  }));
};

Blog.prototype.writeTags = function() {
  const tagData = this.getTagData();
  return Promise.all(Object.entries(tagData).map(([key, tag]) => {
    var model = this.getModel({
      title: {
        text: this.pages.tags.title.replace("[TAG]", key),
        show: true
      },
      tagData: tag
    });
    const outputDir = path.join(config._OUTPUT_DIR, this.rootDir, key);
    return this.writePage(model, this.templateData.pages.tags, "index.html", outputDir);
  }));
};

Blog.prototype.writeFeed = function() {
  return Promise.all(new Array(Math.ceil(this.posts.length/this.feed.pageSize)).fill(0).map(async (v, i) => {
    await this.writeFeedPage(i);
    logger.debug("JSON blog Feed created");
  });
};

Blog.prototype.writeFeedPage = function(pageNo) {
  const pageUrl = `${config.server.url}${this.rootDir}`;
  const postPageData = this.getFeedPostData(pageNo);
  const feed = {
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
  const filename = 'feed' + ((pageNo > 0) ? pageNo : '') + '.json';
  return fs.writeFile(path.join(config._OUTPUT_DIR, this.rootDir, filename), JSON.stringify(feed, null, 2));
};

Blog.prototype.getFeedPostData = function(pageNo) {
  const startIndex = this.feed.pageSize*pageNo;
  const endIndex = startIndex+this.feed.pageSize;
  const posts = this.posts.slice(startIndex, endIndex).map(post => {
    return {
      id: post.id,
      url: `${config.server.url}${this.rootDir}/${post.dir}`,
      title: post.title,
      content_html: post.body,
      content_text: h2p(post.body),
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

Blog.prototype.loadData = function() {
  await Page.prototype.loadData.call(this);
  this.rootDir = path.sep + this.id;
  this.posts = this.posts.concat(
    this.getPosts(config._POSTS_DIR),
    this.includeDrafts ? this.getPosts(config._DRAFTS_DIR) : []
  );
  this.organisePosts();
};

Blog.prototype.write = function() {
  await Page.prototype.write.call(this);
  return this.writeFeed();
};

export default Blog;