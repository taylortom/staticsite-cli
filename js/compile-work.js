import config from '../js/config.js';
import fs from 'fs/promises';
import Page from './compile-page.js';
import path from 'path';

var Work = function(id, data, args) {
  Page.call(this, id, data);
  this.type = "work";
};

Work.prototype = Object.create(Page.prototype);
Work.prototype.contructor = Work;

/*
* OVERRIDES START HERE...
*/

Work.prototype.loadData = async function() {
  await Page.prototype.loadData.call(this);
  this.projects = await JSON.parse(fs.readFile(path.join(config._DATA_DIR, "projects.json")));
};

export default Work;
