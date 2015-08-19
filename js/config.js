var path = require("path");

/*
* Global configuration object, builds on the package.json and _config.json
*/
var config = module.exports = {};

(function init(){
    config._CLI_ROOT = path.dirname(require.main.filename);
    config._TEMP_DIR = path.join(config._CLI_ROOT, "tmp");
    config._OUTPUT_DIR = path.join(config._TEMP_DIR, "site");
    config._SRC_DIR = path.join(config._TEMP_DIR, "src");
    config._PAGES_DIR = path.join(config._SRC_DIR, "_pages");
    config._POSTS_DIR = path.join(config._SRC_DIR, "_posts");
    config._TEMPLATES_DIR = path.join(config._SRC_DIR, "_templates");
    config._POST_ASSETS_DIR = path.join(config._SRC_DIR, "assets");

    // load up the JSON files
    addConfigFile("../package.json"); // CLI
    addConfigFile(path.join(config._SRC_DIR, "_config.json")); // site
})();

function addConfigFile(filename) {
    try {
        var fileJSON = require(filename);
        for(var key in fileJSON) {
            if(!config[key]) config[key] = fileJSON[key];
        }
    } catch(e) { console.log("error: " + e); }
};
