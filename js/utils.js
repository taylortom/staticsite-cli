import logger from './logger.js';
import moment from 'moment';

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
    array.filter(f => {
      var match = true;
      if(config.type) {
        match = filename.slice(filename.lastIndexOf(".")) === config.type;
      }
      if(config.hidden) {
        match = filename[0] === ".";
      }
      return match;
    });
  }
};

export default Utils;
