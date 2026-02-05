import pino from 'pino';

const {
    LOG_LEVEL,
    NODE_ENV
} = process.env

const logger = pino({
  level: LOG_LEVEL || NODE_ENV === 'production' ? 'info' : 'trace',
  
  // Pretty print in development
  transport: NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname,username',
        }
      }
    : undefined, // JSON output in production
});

export default logger;
