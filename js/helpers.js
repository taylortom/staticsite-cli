import handlebars from 'handlebars';
import logger from './logger';
import utils from './utils';

/**
* handlebars helpers
*/

handlebars.registerHelper("log", function(value) {
  logger.debug("hbs.log: " + JSON.stringify(value, null, ' '));
});

handlebars.registerHelper("dateFormat", function(value) {
  return utils.formatDate(value, "DD/MM/YYYY");
});

handlebars.registerHelper("lowerCase", function(value) {
  if(value) return value.toLowerCase();
});

handlebars.registerHelper("newerPageLink", function(value) {
  var no = value-1;
  return "/blog" + (no == 1 ? "" : "/page" + no);
});

handlebars.registerHelper("olderPageLink", function(value) {
  return "/blog/page" + (++value);
});

handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) return options.fn(this);
  return options.inverse(this);
});
