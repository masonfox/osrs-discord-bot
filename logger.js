const winston  = require('winston');

const logger = winston.createLogger({
  level: 'info', // default
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with console format
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.simple(),
//   }));
// }

module.exports = logger