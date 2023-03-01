import chalk from 'chalk';
import config from './config.js';

/*
* Various debugging shortcuts
*/
const Logger = {
  log: ({ prefix = '', style, suffix = '' }) => {
    return m => console.log(prefix, chalk[style]?.(m) ?? m, suffix);
  },
  // string styling
  file: value => chalk.magenta(value),
  var: value => '"' + value + '"',
  // sets up logging functions based on config data (e.g. logger.debug()).
  initialise: () => {
    var { level, logFilters, logTypes } = config.logging;
    var filters = logFilters[level];
    if(!filters) {
      Logger.warn(`debugging level '${level}' not recognised, switching to 'normal'`);
      filters = logFilters.normal;
    }
    for(var key in logTypes) {
      const enable = filters[0] === "*" || filters.includes(key);
      Logger[key] = enable ?  Logger.log(logTypes[key]) : () => {};
    }
  }
};

export default Logger;