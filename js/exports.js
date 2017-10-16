var fs = require('fs');

var exports = {};

['build','serve'].forEach(function(name) {
  exports[name] = function(args, cb) {
    if(typeof args === 'function') {
      cb = args;
      args = {};
    }
    if(args.dir && fs.existsSync(args.dir)) {
      process.env.SITE_SRC = args.dir;
    }
    require(`../bin/${name}`)(args, cb);
  }
});

module.exports = exports;
