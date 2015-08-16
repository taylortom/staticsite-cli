var config = require("../js/config.js");

module.exports = function save(cbSaved) {
    // console.log("   ", config.repos.site, "updated");
    console.log("save");
    cbSaved();
};
