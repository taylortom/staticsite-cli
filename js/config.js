var configJSON = require("../config/config.json");
var config = {};

for(var key in configJSON) {
    config[key] = configJSON[key];
}

/*
* Global configuration object, builds on the config.json
*/
module.exports = config;
