import config from '../js/config.js';
import fs from 'fs-extra';
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

Work.prototype.loadData = function(cbDataLoaded) {
  Page.prototype.loadData.call(this, error => {
    if(error) return cbDataLoaded(error);
    
    fs.readJson(path.join(config._DATA_DIR, "projects.json"), (error, projectsJson) => {
      if(error) return cbDataLoaded(error);
      this.projects = projectsJson;
      cbDataLoaded();
    });
  });
};

export default Work;
