const { SlashCommandBuilder } = require('@discordjs/builders');
const Logger = require('nodemon/lib/utils/log');
const {
  fetchGuildById, fetchPlayerById, fetchOSRSPlayer, _isEmpty,
} = require('../utilities');
const client = require('../client');
const app = require('../app/core');
const mongo = require('../db');

/**
 * Get OSRS data and insert into players collection
 * @param {string} name
 */
async function insertNewPlayer(name) {
  const { players } = await app.getRSData([{ name }]);
  await app.trackNewPlayer(players[0]);
}

exports.data = new SlashCommandBuilder()
  .setName('track')
  .setDescription("Add players to your guild's tracking list")
  .addStringOption((option) => option
    .setName('rsn')
    .setDescription('The OSRS player name')
    .setRequired(true));

exports.execute = async (interaction, logger) => {
  await interaction.deferReply({ ephemeral: true });
  const rsn = interaction.options.getString('rsn');
  const rsnLowered = rsn.toLowerCase();

  logger.info('Command args', { args: { name: rsnLowered } });

  // determine if the player exists in general
  const hiscore = await fetchOSRSPlayer(rsn);
  if (_isEmpty(hiscore)) {
    logger.info("Can't find RSN in hiscores", { name: rsnLowered });
    return interaction.editReply(`I wasn't able to find a player named **${rsn}** in the OSRS hiscores. :/`);
  }

  // confirm guild subscription exists
  const guild = await fetchGuildById(interaction.guildId);

  // confirm the guilds exists and that they're subscribed to updates
  if (guild && guild?.subscribed) {
    // prepare channel for messaging
    const channel = client.channels.cache.get(guild.channelId);

    /**
     * Addition Logic
     */
    // see if they're already tracking this user
    if (guild.players.includes(rsnLowered)) {
      Logger.info('Player already tracked by guild', {
        name: rsnLowered,
        guildId: guild.guildId,
      });
      return interaction.editReply(`You're already tracking **${rsn}**! No worries!`);
    }

    // see if they already exist in the players collection
    const player = await fetchPlayerById(rsnLowered);

    // if they don't exist in the players collection, add them
    if (!player) {
      // get RS data results and insert the player
      logger.info('New player - adding to players collection', { name: rsnLowered });
      await insertNewPlayer(rsn);
    }

    // update the guild tracking list
    await mongo.db.collection('guilds').updateOne(
      { _id: interaction.guildId },
      {
        $addToSet: { players: rsnLowered },
        $set: { updatedAt: new Date() },
      },
    );

    logger.info('Guild successfully tracking new player', {
      guildId: guild.guildId,
      guildName: guild.guildName,
      channelName: guild.channelName,
      name: rsnLowered,
    });

    // send success messages
    channel.send(`🎉 ${interaction.user.username} added RSN **${rsn}** to your guild's tracked players list! You can check that list any time with \`/players\`.`);
    return interaction.editReply(`**${rsn}** successfully added to your guild's tracking list!`);
  }

  logger.info('Command escaped - server not subscribed');

  // server isn't subscribed - ask them too
  return interaction.editReply("Hm, this server isn't subscribed yet! Use \`/subscribe\` to get started or re-activate!");
};
