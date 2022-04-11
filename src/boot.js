const logger = require("../logger");
const app = require("./app/core");
const recap = require("./app/recap");
var cron = require("node-cron");
const { fetchGuildCount, getTime, addTimeFromNow } = require("./utilities");

// config
let cronRuns = 1;
let nextRun = getTime();
const cronTimes = {
  bihourly:
    process.env.NODE_ENV !== "production" ? "*/30 * * * * *" : "0 */2 * * *", // 30 seconds or at minute 0 past every 2nd hour
  weekly:
    process.env.NODE_ENV !== "production" ? "*/30 * * * * *" : "5 0 * * MON", // 30 seconds or at 00:05 UTC on Monday
  monthly:
    process.env.NODE_ENV !== "production" ? "*/30 * * * * *" : "5 0 1 * *", // 30 seconds or at 00:05 on day-of-month 1
};

/**
 * The primary function resposnible for booting the functionality of the bot
 */
module.exports = async function boot() {
  // fire app logic
  app.main();
  // increment count
  updateNextRun();

  /**
   * Bi-Hourly Cron
   * This runs the standard update cron every 2 hours
   */
  cron.schedule(cronTimes.bihourly, () => {
    logger.info(
      `The bihourly cron has run ${cronRuns} time${cronRuns > 1 ? "s" : ""}`
    );
    // fire app logic
    app.main();
    // increment count
    cronRuns += 1;
    updateNextRun();
  });

  /**
   * Weekly Cron
   * This runs the weekly recap cron
   */
  cron.schedule(cronTimes.weekly, () => {
    logger.info(`Executing weekly recap!`);
    // fire weekly recap logic
    recap.main("week")
  });

  /**
   * Monthly Cron
   * This runs the monthly recap cron
   */
  cron.schedule(cronTimes.monthly, () => {
    logger.info(`Executing monthly recap!`);
    // fire monthly recap logic
    recap.main("month")
  });
}

/**
 * Handles setting and announcing the time the cron will run again
 */
function updateNextRun() {
  nextRun = addTimeFromNow(2, "hour");
  logger.info(`Next update at: ${nextRun}`);
}
