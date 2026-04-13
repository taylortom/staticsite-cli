import config from './config.js';
import hl from 'highlight.js';
import { marked } from 'marked';
import markedFootnote from 'marked-footnote';
import path from 'path';

function imageReplace(s) {
  return s.replace('file://', `${config.globals.assetsDir}${path.sep}`);
}
/*
* Takes markdown-formatted data, and converts to an HTML string.
*/
export default function render(text) {
  // overrides for the Marked HTML renderer
  marked.use(markedFootnote());
  marked.use({
    renderer: {
      code({ text }) {
        return `<div class="source_code" style="white-space: pre-wrap;">${hl.highlightAuto(text).value}</div>`;
      },
      codespan({ text }) {
        return `<span class="source_code inline">${text}</span>`;
      },
      image({ href, title, text }) {
        return `<a href="${href}"><img class='media' title="${title || ''}" alt="${text || ''}" src="${imageReplace(href)}" /></a>`;
      },
      html({ text }) { // TODO this is only block-level
        if(!text) return;
        var match = text.match(/<(.*?)\s/);
        if(match) {
          var name = text.match(/<(.*?)\s/)[1];
          if(name === "youtube") {
            return `<div class='youtubeWrapper'><div class='inner'><iframe frameborder='0' allowfullscreen='' src='https://www.youtube.com/embed/${text.match(/video-id="(.*)"/)[1]}?rel=0&amp;showinfo=0' allowfullscreen></iframe></div></div>`;
          }
        }
        return text;
      }
    }
  });
  text = imageReplace(text);
  return marked.parse(text);
};
