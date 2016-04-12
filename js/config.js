var _ = require("underscore");
var async = require("async");
var fs = require("fs-extra");
var path = require("path");

/*
* Global configuration object, builds on the package.json and _config.json
*/
var config = module.exports = {
    _CLI_ROOT: path.join(path.dirname(require.main.filename))
};

config.set = module.exports.set = function(toSet) {
    for(var key in toSet)
        config[key] = toSet[key];

    // fs.writeFileSync(path.join(config._CLI_ROOT, 'config.json'), JSON.stringify(config, null, "    "));
};

(function init() {
        // CLI config
        addConfigFile(path.join(config._CLI_ROOT, "package.json"));

        var siteSrc = path.sep + path.relative(process.env.HOME, config.siteSrc || path.join(config._CLI_ROOT, "src"));

        // directories
        config._OUTPUT_DIR = path.join(config._CLI_ROOT, "site");
        config._SRC_DIR = siteSrc;
        config._PAGES_DIR = path.join(config._SRC_DIR, "_pages");
        config._POSTS_DIR = path.join(config._SRC_DIR, "_posts");
        config._JS_DIR = path.join(config._SRC_DIR, "_js");
        config._LESS_DIR = path.join(config._SRC_DIR, "_less");
        config._DRAFTS_DIR = path.join(config._POSTS_DIR, "drafts");
        config._TEMPLATES_DIR = path.join(config._SRC_DIR, "_templates");
        config._POST_ASSETS_DIR = path.join(config._SRC_DIR, "assets");

        // Site config
        addConfigFile(path.join(config._SRC_DIR, "_config.json"));
})();

function addConfigFile(filePath, cbAdded) {
    try {
        var fileJSON = fs.readJsonSync(filePath, { throws: false });
        config.set(fileJSON);
    } catch(e) {
        var error = new Error("Couldn't load config file: " + filePath + '.', e.message);
        throw error;
    }
};
