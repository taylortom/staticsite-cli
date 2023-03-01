import logger from './logger.js';
import moment from 'moment';
import path from 'path';

/*
* various helper functions
*/

const Utils = {
  formatDate: (date,format) => {
    var d = new Date(date);
    if(isNaN(d.getTime())) logger.error(`utils.formatDate: Invalid date passed: '${date}'`);
    return moment(d).format(format);
  },
  fileFilter: (array, config) => {
    return array.filter(f => {
      return [
        !config.hidden || f[0] !== ".",
        !config.type || path.extname(f) === config.type
      ].every(Boolean);
    });
  }
};

export default Utils;
