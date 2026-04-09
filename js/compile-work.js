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
  const data = await fs.readFile(path.join(config._DATA_DIR, "projects.json"), 'utf-8');
  this.projects = JSON.parse(data);
};

export default Work;
