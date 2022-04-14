const { SlashCommandBuilder } = require('@discordjs/builders');
const { hiscores } = require('osrs-json-api');
const { fetchGuildById, fetchPlayerById } = require('../utilities');
const logger = require('../../logger');
const client = require('../client');
const app = require('../app/core');
const mongo = require('../db');

exports.data = new SlashCommandBuilder()
  .setName('track')
  .setDescription("Add players to your guild's tracking list")
  .addStringOption((option) => option
    .setName('rsn')
    .setDescription('The OSRS player name')
    .setRequired(true));

exports.execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });
  const rsn = interaction.options.getString('rsn');
  const rsnLowered = rsn.toLowerCase();

  // determine if the player exists in general
  try {
    await hiscores.getPlayer(rsn);
  } catch (error) {
    logger.error(error);
    return await interaction.editReply(`I wasn't able to find a player named **${rsn}** in the OSRS hiscores. :/`);
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
    if (guild.players.includes(rsnLowered)) { return await interaction.editReply(`You're already tracking **${rsn}**! No worries!`); }

    // see if they already exist in the players collection
    const player = await fetchPlayerById(rsnLowered);

    // if they don't exist in the players collection, add them
    if (!player) {
      // get RS data results and insert the player
      logger.info(`"${rsn}" added to players collection`);
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

    logger.info(`"${rsn}" now tracked by ${guild.guildName} guild in ${guild.channelName} channel`);

    // send success messages
    await interaction.editReply(`**${rsn}** successfully added to your guild's tracking list!`);
    channel.send(`🎉 ${interaction.user.username} added RSN **${rsn}** to your guild's tracked players list! You can check that list any time with \`/players\`.`);
  } else {
    // server isn't subscribed - ask them too
    await interaction.editReply("Hm, this server isn't subscribed yet! Use \`/subscribe\` to get started or re-activate!");
  }
};

async function insertNewPlayer(name) {
  const data = await app.getRSData([{ name }]);
  await app.trackNewPlayer(data[0]);
}
