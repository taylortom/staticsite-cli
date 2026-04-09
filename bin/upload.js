import { Client } from 'basic-ftp';
import config from '../js/config.js';
import logger from '../js/logger.js';

/*
* @name upload
* @description Uploads the tmp/site files to the specified server via FTP
*/
export default async function upload(args) {
  logger.task('Connecting to server');

  const client = new Client();
  try {
    await client.access({
      host: config.ftp.host,
      port: config.ftp.port || 21,
      user: config.ftp.user,
      password: config.ftp.password,
    });
    logger.debug(`Connected to server ${logger.var(config.ftp.host)} as ${logger.var(config.ftp.user)}`);

    logger.task("Cleaning remote folder");
    await client.clearWorkingDir();

    logger.task('Uploading files to server');
    await client.uploadFromDir(config._OUTPUT_DIR);
  } finally {
    client.close();
  }
};
