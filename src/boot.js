const cron = require('node-cron');
const logger = require('../logger');
const app = require('./app/core');
const recap = require('./app/recap');

// config
const cronTimes = {
  bihourly:
    process.env.NODE_ENV !== 'production' ? '*/30 * * * * *' : '0 */2 * * *', // 30 seconds or at minute 0 past every 2nd hour
  weekly:
    process.env.NODE_ENV !== 'production' ? '*/30 * * * * *' : '5 0 * * MON', // 30 seconds or at 00:05 UTC on Monday
  monthly:
    process.env.NODE_ENV !== 'production' ? '*/30 * * * * *' : '5 0 1 * *', // 30 seconds or at 00:05 on day-of-month 1
};

/**
 * The primary function resposnible for booting the functionality of the bot
 */
module.exports = async function boot() {
  // fire app logic
  app.main();

  /**
   * Bi-Hourly Cron
   * This runs the standard update cron every 2 hours
   */
  cron.schedule(cronTimes.bihourly, () => {
    // fire app logic
    app.main();
  });

  /**
   * Weekly Cron
   * This runs the weekly recap cron
   */
  cron.schedule(cronTimes.weekly, () => {
    logger.info('Executing weekly recap!');
    // fire weekly recap logic
    recap.main('week');
  });

  /**
   * Monthly Cron
   * This runs the monthly recap cron
   */
  cron.schedule(cronTimes.monthly, () => {
    logger.info('Executing monthly recap!');
    // fire monthly recap logic
    recap.main('month');
  });

  logger.info('✅ The crons/trackers have been booted');
};
