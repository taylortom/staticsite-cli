import _ from 'underscore';
import async from 'async';
import config from '../js/config.js';
import less from './less.js';

/*
* @name compile
* @description Generates the static pages in the output folder
*/
export default function compile(args, cbCompiled) {
  async.parallel([
    function(cbDone) { compilePages(args,cbDone); },
    function(cbDone) { less(args,cbDone); }
  ], cbCompiled);
};

function compilePages(args, cbCompiled) {
  async.forEachOf(config.pages, function iterator(page, key, cbDoneLoop) {
    getPageModule(key, (e, Page) => {
      console.log(Page);
      var p = new Page(key, page, args);
      async.parallel([
        _.bind(p.loadTemplates, p),
        _.bind(p.loadData, p)
      ], function(error) {
        if(error) return cbDoneLoop(error);
        p.write(cbDoneLoop);
      });
    })
  }, cbCompiled);
}

async function getPageModule(key, cbLoaded) {
  // look for custom page first, then fall back to default
  let Page;
  try { Page = await import(`../js/compile-${key}.js`); }
  catch(e) { Page = await import('../js/compile-page.js'); }
  cbLoaded(null, Page.default);
}
