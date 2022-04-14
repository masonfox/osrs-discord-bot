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

    // launch the bot's functionality
    boot();
  },
};
