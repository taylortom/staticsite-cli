var log = require("./logger");
var marked = require("marked");
var path = require("path");

var config = require("./config");

// TODO also allow file path

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
* TODO: add these to templates?
*/
var renderer = new marked.Renderer();

renderer.heading = function(text, level) {
    return '<div class="heading h' + level + '">' + text + '</div>';
};

// TODO add a highlighter
renderer.code = function(value) {
    return '<div class="source_code" style="white-space: pre-wrap;">' + value + '</div>';
};

renderer.codespan = function(value) {
    return '<span class="source_code inline">' + value + '</span>';
};

renderer.blockquote = function(value) {
    return '<div class="blockquote">' + value + '</div>';
};

renderer.image = function(href, title, alt) {
    return "<img class='media' title='" + title + "' alt='" + alt + "' src='" + href.replace(replacements.localFile.match, replacements.localFile.replace) + "' />";
};

// TODO this is only block-level
renderer.html = function(value) {
    if(!value) return;
    var name = value.match(/<(.*?)\s/)[1];
    //TODO allow for ' or "?
    switch(name) {
        case "youtube":
            return "<iframe class='media' width='480' height='320' src='https://www.youtube.com/embed/" + value.match(/video-id="(.*)"/)[1] + "?rel=0&amp;showinfo=0' allowfullscreen></iframe>";
        case "icon":
            return "<span class='icon-" + value.match(/name="(.*)"/)[1] + "' style='display:inline;'></span>";
        default:
            return value;
    }
};
