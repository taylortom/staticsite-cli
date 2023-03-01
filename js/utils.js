import _ from 'underscore';
import logger from './logger.js';
import moment from 'moment';

/*
* various helper functions
*/
var exports = {};

exports.formatDate = function(date,format) {
  var d = new Date(date);
  if(isNaN(d.getTime())) logger.error("utils.formatDate: Invalid date passed: '" + date + "'");
  return moment(d).format(format);
};

exports.fileFilter = function(array, config) {
  return _.filter(array, function(filename) {
    var match = true;
    if(config.type) {
      match = filename.slice(filename.lastIndexOf(".")) === config.type;
    }
    if(config.hidden) {
      match = filename[0] === ".";
    }
    return match;
  });
};

export default exports;