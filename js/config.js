import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

/*
* Global configuration object, builds on the package.json and _config.json
*/
var config = {
  _CLI_MODE: true,
  _CLI_ROOT: fileURLToPath(new URL('..', import.meta.url)),
  _PROJECT_ROOT: path.join(process.cwd()),
  initialise: function() {
    absorbConfigFile(path.join(config._CLI_ROOT, "package.json"));
    // directories
    config._SRC_DIR = process.env.SITE_SRC || config._PROJECT_ROOT;
    config._OUTPUT_DIR = process.env.SITE_OUTPUT || path.join(config._PROJECT_ROOT, "_build");
    config._DATA_DIR = path.join(config._SRC_DIR, '_data');
    config._PAGES_DIR = path.join(config._SRC_DIR, "_pages");
    config._POSTS_DIR = path.join(config._SRC_DIR, "_posts");
    config._JS_DIR = path.join(config._SRC_DIR, "_js");
    config._LESS_DIR = path.join(config._SRC_DIR, "_less");
    config._DRAFTS_DIR = path.join(config._POSTS_DIR, "drafts");
    config._TEMPLATES_DIR = path.join(config._SRC_DIR, "_templates");
    config._POST_ASSETS_DIR = path.join(config._SRC_DIR, "assets");
    // Site config
    absorbConfigFile(path.join(config._DATA_DIR, "config.json"));
    // Theme settings
    applyThemeSettings();
  },
  set: function(toSet) {
    for(var key in toSet) config[key] = toSet[key];
  }
};

function absorbConfigFile(filePath) {
  try {
    Object.assign(config, JSON.parse(fs.readFileSync(filePath).toString()));
  } catch(e) {
    console.error(new Error(`Couldn't load config file: "${filePath}.`), e.toString());
  }
}

function applyThemeSettings() {
  // Store theme settings 
  config.theme = { // defaults
    name: "default",
    main: "base.less",
    options: { compress: true }
  };
  var themeSettings = config.themes.find(t => t.name === config.theme) ?? {};
  Object.assign(config.theme, themeSettings);
}

export default config;