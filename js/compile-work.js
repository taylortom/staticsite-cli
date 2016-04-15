var _ = require("underscore");
var async = require("async");
var fs = require("fs-extra");
var path = require("path");

var Page = require("./compile-page");
var config = require("../js/config");
var logger = require("../js/logger");

var Work = module.exports = function(id, data, args) {
    Page.call(this, id, data);
    this.type = "work";
};

Work.prototype = Object.create(Page.prototype);
Work.prototype.contructor = Work;

/*
* OVERRIDES START HERE...
*/

Work.prototype.loadData = function(cbDataLoaded) {
    var self = this;
    Page.prototype.loadData.call(this, _.bind(function loadedData(error) {
        if(error) return cbDataLoaded(error);
        fs.readJson(path.join(config._DATA_DIR, "projects.json"), function jsonLoaded(error, projectsJson) {
            if(error) return cbDataLoaded(error);
            self.projects = projectsJson;
            cbDataLoaded();
        });
    }, this));
};
