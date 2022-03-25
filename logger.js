require('dotenv').config();
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // default
  exitOnError: false,
  format: format.json(),
  transports: [
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with console format
if (process.env.NODE_ENV == 'production') {
  logger.add(new transports.Http({
    host: 'http-intake.logs.datadoghq.com',
    path: `/api/v2/logs?dd-api-key=${process.env.DD_API_KEY}&ddsource=nodejs&service=app&host=heroku`,
    ssl: true,
    format: format.json()
  }))
} else {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

module.exports = logger