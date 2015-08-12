var moment = require("moment");

var exports = module.exports = {};

exports.formatDate = function(date,format) {
    return moment(date).format(format);
}
