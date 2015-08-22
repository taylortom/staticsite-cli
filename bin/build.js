var async = require("async");
var handlebars = require("handlebars");

var config = require("../js/config");
var logger = require("../js/logger");
var utils = require("../js/utils");

module.exports = function build(args, cbBuilt) {
    async.forEachOf(config.pages, function iterator(page, key, cbDoneLoop) {
        try { var Page = require("./build-" + key); }
        catch(e) { var Page = require("./build-page"); }

        var p = new Page(key,page);

        /*
        async.parallel([

        ], function(error) {
            if(error) return cbBuild(error);

            p.write(function(error) {
                if(error) return cbBuilt(error);

                console.log(p.title, " written");
                // console.log(p);
                cbDoneLoop();
            });
        });
        */

        p.loadTemplates(function(error) {
            if(error) return cbBuilt(error);

            p.loadData(function(error) {
                if(error) return cbBuilt(error);

                p.write(function(error) {
                    if(error) return cbBuilt(error);
                    cbDoneLoop();
                });
            });
        });
    }, cbBuilt);
};

/**
* handlebars helpers
*/
handlebars.registerHelper("log", function(value) {
    logger.debug("TEMPLATE", value);
});

handlebars.registerHelper("dateFormat", function(value) {
    return utils.formatDate(value, "DD/MM/YYYY");
});

handlebars.registerHelper("lowerCase", function(value) {
    if(value) return value.toLowerCase();
});

handlebars.registerHelper("newerPageLink", function(value) {
    var no = value-1;
    return "/blog" + (no == 1 ? "" : "/page" + no);
});

handlebars.registerHelper("olderPageLink", function(value) {
    return "/blog/page" + (++value);
});

handlebars.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) return options.fn(this);
    return options.inverse(this);
});
