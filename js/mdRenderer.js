var hl = require("highlight.js").highlightAuto;
var marked = require("marked");
var path = require("path");

var config = require("./config");

/*
* Takes markdown-formatted data, and converts to an HTML string.
*/
var exports = module.exports = function render(text) {
  // custom replacements
  for(var key in replacements)
    text = text.replace(replacements[key].match, replacements[key].replace);

  return marked(text, { renderer: renderer });
};

var replacements = {
  localFile: {
    match: "file://",
    replace: config.globals.assetsDir + path.sep
  }
};

/**
* Marked renderer overrides
*/
var renderer = new marked.Renderer();

renderer.heading = function(text, level) {
  var tag = `h${level}`;
  return `<${tag}>${text}</${tag}>`;
};

renderer.code = function(value) {
  return '<div class="source_code" style="white-space: pre-wrap;">' + hl(value).value + '</div>';
};

renderer.codespan = function(value) {
  return '<span class="source_code inline">' + value + '</span>';
};

renderer.blockquote = function(value) {
  return '<div class="blockquote">' + value + '</div>';
};

renderer.image = function(href, title, alt) {
  return "<a href='" + href + "'><img class='media' title='" + title + "' alt='" + alt + "' src='" + href.replace(replacements.localFile.match, replacements.localFile.replace) + "' /></a>";
};

// TODO this is only block-level
renderer.html = function(value) {
  if(!value) return;
  var name = value.match(/<(.*?)\s/)[1];
  //TODO allow for ' or "?
  switch(name) {
    case "youtube":
      return "<div class='youtubeWrapper'><div class='inner'><iframe frameborder='0' allowfullscreen='' src='https://www.youtube.com/embed/" + value.match(/video-id="(.*)"/)[1] + "?rel=0&amp;showinfo=0' allowfullscreen></iframe></div></div>";
    default:
      return value;
  }
};
