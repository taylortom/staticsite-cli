var logger = require("./logger");
var moment = require("moment");

/*
* various helper functions
*/
var exports = module.exports = {};

exports.formatDate = function(date,format) {
    var d = new Date(date);
    if(isNaN(d.getTime())) logger.error("utils.formatDate: Invalid date passed");
    return moment(d).format(format);
}
