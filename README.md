# README

Source code for a Node.js command-line tool for building static websites.

- Templating with [Handlebars](http://handlebarsjs.com/).
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
tt
```

### CLI commands

Command | Description
------- | -----------
| `clean` | Removes everything in the output folder |
| `copy` | Copies files/folders in `_SRC_DIR` not prefixed with `_` or `.` or blacklisted |                                                 
| `build` | Shortcut for clean + copy + compile |
| `compile` | Generates the static pages in the output folder |
| `init` | Downloads the repos and readies the file system |
| `launch` | Opens site in browser |
| `post` | Creates an empty post file, opens in text editor by default or to open in browser, add `--html` |
| `less` | Compiles the less to the output folder |
| `set` | Sets config options from the command line |
| `serve` | Runs local server and opens in browser |
| `watch` | Watches for changes, and executes the relevant CLI command set in `config.json` |

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
`_templates` | Handlebars template files for the site pages. Main page wrapper taken from `page.html`.
