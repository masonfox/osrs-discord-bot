require('dotenv').config();
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // default
  exitOnError: false,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
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
}

module.exports = logger