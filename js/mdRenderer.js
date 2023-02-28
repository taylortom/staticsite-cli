import config from './config.js';
import { highlightAuto as hl } from 'highlight.js';
import marked from 'marked';
import path from 'path';

function imageReplace(s) {
  return s.replace('file://', `${config.globals.assetsDir}${path.sep}`);
}
/*
* Takes markdown-formatted data, and converts to an HTML string.
*/
export default function render(text) {
  // overrides for the Marked HTML renderer
  marked.use({ 
    renderer: {
      heading(value, level) {
        var tag = `h${level}`;
        return `<${tag}>${value}</${tag}>`;
      },
      code(value) {
        return `<div class="source_code" style="white-space: pre-wrap;">${hl(value).value}</div>`;
      },
      codespan(value) {
        return `<span class="source_code inline">${value}</span>`;
      },
      blockquote(value) {
        return `<div class="blockquote">${value}</div>`;
      },
      image(href, title, alt) {
        return `<a href="${href}"><img class='media' title="${title}" alt="${alt}" src="${imageReplace(href)}" /></a>`;
      },
      html(value) { // TODO this is only block-level
        if(!value) return;
        var match = value.match(/<(.*?)\s/);
        if(match) {
          var name = value.match(/<(.*?)\s/)[1];
          if(name === "youtube") {
            return `<div class='youtubeWrapper'><div class='inner'><iframe frameborder='0' allowfullscreen='' src='https://www.youtube.com/embed/${value.match(/video-id="(.*)"/)[1]}?rel=0&amp;showinfo=0' allowfullscreen></iframe></div></div>`;
          }
        }
        return value;
      }
    }
  });
  text = imageReplace(text);
  return marked.parse(text);
};