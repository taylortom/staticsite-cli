import config from '../js/config.js';
import less from './less.js';

/*
* @name compile
* @description Generates the static pages in the output folder
*/
export default async function compile(args) {
  await Promise.all([compilePages(args), less(args)]);
};

async function compilePages(args) {
  await Promise.all(Object.entries(config.pages).map(async ([key, page]) => {
    const Page = await getPageModule(key);
    const p = new Page(key, page, args);
    await Promise.all([p.loadTemplates(), p.loadData()]);
    await p.write();
  }));
}

async function getPageModule(key) {
  try { return (await import(`../js/compile-${key}.js`)).default; }
  catch(e) { return (await import('../js/compile-page.js')).default; }
}
