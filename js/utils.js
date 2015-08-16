var moment = require("moment");

var exports = module.exports = {};

exports.formatDate = function(date,format) {
    var d = new Date(date);
    if(isNaN(d.getTime())) console.log("Invalid date passed");
    return moment(d).format(format);
}
