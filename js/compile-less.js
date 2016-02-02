var fs = require('fs-extra');
var less = require('less');
var cleanCSS = require('less-plugin-clean-css');
var path = require('path');
var walk = require('fs-walk');

var config = require('./config');

module.exports = function compileLESS(args, cbCompiled) {
    fs.readFile(path.join(config._LESS_DIR,config.theme.main), "utf-8", function onRead(error, file) {
        if(error) return cbCompiled(error);

        var options = config.theme.options;
        options.paths = [ config._LESS_DIR ];

        if(options.compress === true) {
            if(!options.plugins) options.plugins = [];
            cleanCSSPlugin = new cleanCSS({ advanced: true });
            options.plugins.push(cleanCSSPlugin);
        }

        less.render(file, options, function (error, output) {
            if(error) {
                error.message = "Failed to render LESS. " + error.message + " (at " + error.filename + ")";
                cbCompiled(error);
            }
            fs.outputFile(path.join(config._OUTPUT_DIR, "theme.css"), output.css, cbCompiled);
        });
    });
};
