const mongo = require('../db');
const boot = require('../boot');
const logger = require('../../logger');

module.exports = {
  name: 'ready',
  once: true,
  async execute(bot) {
    // Log the bot's username and the amount of servers its in to console
    logger.info(`${bot.user.username} is online on ${bot.guilds.cache.size} servers!`);

    // launch db connection
    await mongo.init();

    // launch the bot's cron/tracking functionality - commands will function without this
    if (process.env.BOOT_APP_CRONS === 'true') {
      boot();
    } else {
      logger.info('❓The app crons/trackers are not running! Please check your .env file if this is unintended.');
    }
  },
};
