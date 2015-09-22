var fs = require('fs-extra');
var less = require('less');
var path = require('path');
var walk = require('fs-walk');

var config = require('./config');

module.exports = function compileLESS(args, cbCompiled) {
    fs.readFile(path.join(config._LESS_DIR,config.theme.main), "utf-8", function onRead(error, file) {
        if(error) return cbCompiled(error);

        var options = config.theme.options;
        options.paths = [ config._LESS_DIR ];

        less.render(file, options, function (error, output) {
            if(error) cbCompiled(error);
            fs.outputFile(path.join(config._OUTPUT_DIR, "theme.css"), output.css, cbCompiled);
        });
    });
};
