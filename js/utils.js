var moment = require("moment");

var exports = module.exports = {};

exports.formatDate = function(date,format) {
    return moment(new Date(date)).format(format);
}
