var config = require("./config.js");

module.exports = function log(message) {
    console.log(config.name + ": " + message);
};
