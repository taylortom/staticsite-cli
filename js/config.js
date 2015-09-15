var path = require("path");

/*
* Global configuration object, builds on the package.json and _config.json
*/
var config = module.exports = {};

(function init(){
    // CLI JSON
    addConfigFile("../package.json");

    config._CLI_ROOT = path.dirname(require.main.filename);
    config._OUTPUT_DIR = path.join(config._CLI_ROOT, "site");
    config._SRC_DIR = config.siteSrc || path.join(config._CLI_ROOT, "src");
    config._PAGES_DIR = path.join(config._SRC_DIR, "_pages");
    config._POSTS_DIR = path.join(config._SRC_DIR, "_posts");
    config._DRAFTS_DIR = path.join(config._POSTS_DIR, "drafts");
    config._TEMPLATES_DIR = path.join(config._SRC_DIR, "_templates");
    config._POST_ASSETS_DIR = path.join(config._SRC_DIR, "assets");

    // Site JSON
    addConfigFile(path.join(config._SRC_DIR, "_config.json"));
})();

function addConfigFile(filename) {
    try {
        var fileJSON = require(filename);
        for(var key in fileJSON) {
            if(!config[key]) config[key] = fileJSON[key];
        }
    } catch(e) { console.log("error: " + e); }
};
