import Logger from 'pino';

export const logger = Logger({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Enable colorized output
      translateTime: true, // Show timestamps in human-readable format
      ignore: 'pid,hostname', // Omit fields like 'pid' and 'hostname'
      singleLine: true // Print log messages in a single line
    }
  }
});
