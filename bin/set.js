import config from '../js/config.js';

/*
* @name set
* @description Sets config options from the command line
*/
export default function set(args, cbDone) {
  // TODO does this work??
  var toSet = args.slice(1);
  config.set(args);
  cbDone(); // sync, so safe to do this
};
