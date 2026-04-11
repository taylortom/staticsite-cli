# README

Source code for a Node.js command-line tool for building static websites.

- Lightweight template engine with Handlebars-style syntax.
- Styling with [LESS](http://lesscss.org/).

## Installation

Prior to installation, you will require a recent installation of Node and NPM.

To test this locally, run:
```
npm link
```

## Usage

Once installed, the tool can be accessed globally with
```
ss
```

### Commands

Command | Description
------- | -----------
| `build` | Shortcut for clean + copy + compile |
| `clean` | Removes everything in the output folder |
| `compile` | Generates the static pages in the output folder |
| `copy` | Copies files/folders in `_SRC_DIR` not prefixed with `_` or `.` or blacklisted |
| `launch` | Opens site in browser |
| `less` | Compiles the less to the output folder |
| `post` | Creates an empty post file, opens in text editor by default or to open in browser, add `--html` |
| `serve` | Runs local server and opens in browser |

### Tool configuration

There are a few settings that can be

### Site source

In order to build a site using the tool, you’ll need to make sure you have a valid source folder set up.

#### Folder structure

Folder       | Description
------------ | -----------
`_data`      | Site configuration data.
`_less`      | Site styling.
`_pages`     | Individual `.md` files for each page.
`_posts`     | Individual `.md` files for each blog post.
`_templates` | Template files for the site pages. Main page wrapper taken from `page.html`.

### Site configuration

The `_data/config.json` is used to define the site structure. In here, you must define the pages you want to appear, as well as various other settings.

The following attributes must appear for a site to be generated:

#### globals

This does something.

```
"globals": {
  "assetsDir": "/assets"
}
```

#### menu

This object defines what's shown on the site's main navigation menu, and should be an array of objects with the form:
```
{
  "id": "", // a unique value for this item
  "html": "", // what's rendered on-screen
  "url": "", // where to navigate on click
  "target": "" // the anchor tag's target
}
```

#### theme

```
"theme": {
  "main": "base.less",
  "options": {
    "compress": true
  }
}
```

#### pages
```
"pages": {
  "home": {
    "title": {
      "text": "Home",
      "show": false
    },
    "description": {
      "text": "You've stumbled across my blog: the home of my most private, innermost thoughts and reflections. And random cat videos.",
      "show": true
    },
    "links": {
      "Latest posts": "/blog",
      "Archive": "/blog/archive"
    },
    "template": "blog.html",
    "subDir": false
  }
}
```
```
"blog": {
  "paginate": {
    "pageSize": 10,
    "pagedAttr": "posts"
  },
  "editor": "atom",
  "pages": {
    "posts": {
      "template": "post.html"
    },
    "tags": {
      "title": "Posts tagged with '[TAG]'",
      "template": "tags.html"
    },
    "archive": {
      "title": "The blog archives",
      "description": "Here you'll find every post from my blog's distant past, so put your feet up, brush off the dust, and read at your own peril.",
      "template": "archive.html"
    }
  }
}
```
