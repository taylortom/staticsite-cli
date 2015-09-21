var _ = require("underscore");
var async = require("async");

var config = require("../js/config");

module.exports = function compile(args, cbCompiled) {
    async.forEachOf(config.pages, function iterator(page, key, cbDoneLoop) {
        try { var Page = require("../js/compile-" + key); }
        catch(e) { var Page = require("../js/compile-page"); }
        var p = new Page(key, page, args);

        async.parallel([
            _.bind(p.loadTemplates, p),
            _.bind(p.loadData, p)
        ], function(error) {
            p.write(cbDoneLoop);
        });
    }, cbCompiled);
}
