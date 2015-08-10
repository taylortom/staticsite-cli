var config = require("../config/config.json");

module.exports = function log(message) {
    console.log(config.name + ": " + message);
};
