var configJSON = require("../config/config.json");
var config = {};

for(var key in configJSON) {
    config[key] = configJSON[key];
}

module.exports = config;
