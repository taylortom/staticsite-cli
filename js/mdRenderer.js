import config from './config.js';
import hl from 'highlight.js';
import { marked } from 'marked';
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
        return `<div class="source_code" style="white-space: pre-wrap;">${hl.highlightAuto(value).value}</div>`;
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
  text = processFootnotes(text);
  var result = text.footnotes ? marked.parse(text.body) + text.footnotes : marked.parse(text);
  return result;
};

/*
* Extracts footnote definitions and references from markdown text.
* Returns the modified text string if no footnotes are found, or an object
* { body, footnotes } if footnotes are present.
*/
function processFootnotes(text) {
  // Collect all footnote definitions: [^label]: text (with optional indented continuation)
  var footnoteMap = {};
  var fnDefRegex = /^\[\^([^\]]+)\]:([ \t]+)([\s\S]*?)(?=\n\[\^|\n\n(?!\s)|\n$|$)/gm;
  var match;
  while ((match = fnDefRegex.exec(text)) !== null) {
    var label = match[1];
    // Trim indented continuation lines and collapse to a single string
    var body = match[3].replace(/\n {4}/g, '\n').trim();
    footnoteMap[label] = body;
  }
  if (Object.keys(footnoteMap).length === 0) return text;

  // Remove footnote definitions from text
  text = text.replace(/^\[\^[^\]]+\]:[ \t]+[\s\S]*?(?=\n\[\^|\n\n(?!\s)|\n$|$)/gm, '');

  // Replace inline footnote references with numbered superscript links
  var footnoteOrder = [];
  text = text.replace(/\[\^([^\]]+)\]/g, function(full, label) {
    if (!footnoteOrder.includes(label)) footnoteOrder.push(label);
    var num = footnoteOrder.indexOf(label) + 1;
    return `<sup id="fnref${num}"><a href="#fn${num}">${num}</a></sup>`;
  });

  // Build the footnotes HTML block
  var footnotesHtml = '<div class="footnotes"><ol>';
  for (var i = 0; i < footnoteOrder.length; i++) {
    var fnLabel = footnoteOrder[i];
    var num = i + 1;
    var fnText = footnoteMap[fnLabel] || '';
    footnotesHtml += `<li id="fn${num}">${fnText} <a href="#fnref${num}">&#8617;</a></li>`;
  }
  footnotesHtml += '</ol></div>';

  return { body: text, footnotes: footnotesHtml };
}