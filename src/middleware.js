const mongo = require('./db');

/**
 * Middleware exports
 * Used to simply commonly used methods ahead of command executions
 * Activated through the command.config.middleware array
 */

exports.guildExists = async (interaction) => {
  // interaction.guildId
  const guild = await mongo.db.collection('guilds').findOne({ _id: 'swag' });
  console.log(guild);
  return (guild == false);
};

exports.guildActive = async (guildId) => {

};
