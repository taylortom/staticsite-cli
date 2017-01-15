var _ = require("underscore");
var logger = require("./logger");
var moment = require("moment");

/*
* various helper functions
*/
var exports = module.exports = {};

exports.formatDate = function(date,format) {
  var d = new Date(date);
  if(isNaN(d.getTime())) logger.error("utils.formatDate: Invalid date passed: '" + date + "'");
  return moment(d).format(format);
};

exports.fileFilter = function(array, config) {
  return _.filter(array, function(filename) {
      var match = true;

      if(config.type) {
        filetype = filename.slice(filename.lastIndexOf("."));
        match = filetype === config.type;
      }
      if(config.hidden) {
        match = filename[0] === ".";
      }

      return match;
  });
};
