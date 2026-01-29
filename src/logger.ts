import pino from 'pino';

const {
    LOG_LEVEL,
    NODE_ENV
} = process.env

const logger = pino({
  level: LOG_LEVEL || NODE_ENV === 'production' ? 'info' : 'debug',
  
  // Pretty print in development
  transport: NODE_ENV !== 'production' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        }
      }
    : undefined, // JSON output in production
});

export default logger;
