var _ = require("underscore");
var async = require("async");
var handlebars = require("handlebars");

var config = require("../js/config");
var logger = require("../js/logger");
var utils = require("../js/utils");

module.exports = function compile(args, cbCompiled) {
    async.forEachOf(config.pages, function iterator(page, key, cbDoneLoop) {
        try { var Page = require("../js/compile-" + key); }
        catch(e) { var Page = require("../js/compile-page"); }
        var p = new Page(key,page);

        async.parallel([
            _.bind(p.loadTemplates, p),
            _.bind(p.loadData, p)
        ], function(error) {
            p.write(cbDoneLoop);
        });
    }, cbCompiled);
};

/**
* handlebars helpers
*/
handlebars.registerHelper("log", function(value) {
    logger.debug("hbs.log: " + value);
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
