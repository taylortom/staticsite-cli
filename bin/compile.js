import config from '../js/config.js';
import less from './less.js';

/*
* @name compile
* @description Generates the static pages in the output folder
*/
export default async function compile(args) {
  await Promise.all([
    compilePages(args),
    less(args)
  ]);
};

async function compilePages(args, cbCompiled) {
  await Promise.all(Object.entries(config.pages).map(async ([key, page]) => {
    const Page = await getPageModule(key, page, args)
    const p = new Page(key, page, args);
    return Promise.all([
      p.loadTemplates(),
      p.loadData()
    ]);
  }));
}

async function getPageModule(key) {
  // look for custom page first, then fall back to default
  let Page;
  try { Page = await import(`../js/compile-${key}.js`); }
  catch(e) { Page = await import('../js/compile-page.js'); }
  return Page.default;
}
