const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const {
  fetchGuildById,
  fetchGuildPlayers,
} = require('../utilities');
const client = require('../client');
const mongo = require('../db');

exports.data = new SlashCommandBuilder()
  .setName('drop')
  .setDescription("Drop/remove players from your guild's tracking list");

exports.execute = async (interaction) => {
  // TODO: convert this to bring all player objs and include relative updatedAt
  const trackedPlayers = await fetchGuildPlayers(interaction.guildId);

  if (trackedPlayers.length === 0) {
    return interaction.reply({
      content: "You're not tracking any players yet.",
      ephemeral: true,
    });
  }

  const playerOptions = trackedPlayers.map((player) => ({
    label: player,
    value: player,
  }));

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('droppedPlayers')
      .setPlaceholder('Select player(s)')
      .setMinValues(1)
      .setMaxValues(playerOptions.length)
      .addOptions(playerOptions),
  );

  return interaction.reply({
    content: "Select players to drop from your guild's tracking list:",
    components: [row],
    ephemeral: true,
  });
};

/**
 * Prune the player and history collections
 * @param {string} rsn
 */
async function dbCleanup(rsn, logger) {
  // find if the player is located anywhere else
  const guilds = await mongo.db
    .collection('guilds')
    .find({ players: rsn })
    .toArray();

  // if they're not tracked by other guilds, delete them
  if (guilds.length === 0) {
    logger.info(`Deleting ${rsn} from player AND history collections; no guilds tracking`, {
      player: rsn,
    });

    // delete player record
    await mongo.db.collection('players').deleteOne({ _id: rsn });

    // delete history records
    await mongo.db.collection('history').deleteMany({ playerId: rsn });
  } else {
    const guildIds = guilds.map((guild) => guild._id);
    logger.info(`Deleting ${rsn} from guild, but not from player collection`, {
      player: rsn,
      guilds: guildIds,
    });
  }
}

exports.handler = async (interaction, handlerId, logger) => {
  await interaction.deferUpdate();

  // confirm guild subscription exists
  const guild = await fetchGuildById(interaction.guildId);

  // confirm the guilds exists
  if (!guild) {
    logger.info('Command escaped - server not subscribed');
    return interaction.editReply(
      "This server isn't subscribed, so you don't have any tracked players!",
    );
  }

  logger.info('Command args', { args: { playersToDrop: interaction.values } });

  const confirmedRemoves = [];

  // loop through all presented rsn's
  for (let index = 0; index < interaction.values.length; index++) {
    const rsn = interaction.values[index]; // already lowered

    // bounce if the guild isn't tracking this player anyway
    if (!guild.players.includes(rsn)) return;

    /**
     * Section: remove the player and send msg
     */
    // remove player from guild tracking
    await mongo.db.collection('guilds').updateOne(
      { _id: interaction.guildId },
      {
        $pull: { players: rsn },
      },
    );

    // push into successful array
    confirmedRemoves.push(rsn);

    // db cleanup of players and history collections
    await dbCleanup(rsn, logger);
  }

  // finalize the response to the initiator and tracking channel
  if (confirmedRemoves.length > 0) {
    let rsnList = '';
    let rsnListBulleted = '';

    for (let index = 0; index < confirmedRemoves.length; index++) {
      const rsn = confirmedRemoves[index];
      rsnList += confirmedRemoves.length - 1 == index ? rsn : `${rsn}, `;
      rsnListBulleted += `- ${rsn}\n`;
    }

    const message = confirmedRemoves.length > 1
      ? `The following players have been successfully removed: **${rsnList}**!`
      : `Player **${rsnList}** has been successfully removed!`;

    logger.info('Player(s) dropped from guild', {
      players: confirmedRemoves,
      dropCount: confirmedRemoves.length,
    });

    await interaction.editReply({ content: message, components: [] });

    // finish with an announcement to the tracking channel
    const channel = client.channels.cache.get(guild.channelId);

    if (confirmedRemoves.length > 1) {
      return channel.send(
        `💀 ${interaction.user.username} removed the following players from your guild's tracked players list. Queue their viking burials! ⚰️🔥\n\n${rsnListBulleted}`,
      );
    }

    return channel.send(
      `💀 ${interaction.user.username} removed RSN **${rsnList}** from your guild's tracked players list. Queue their viking burial! ⚰️🔥`,
    );
  }

  logger.info('No players available to remove');

  return interaction.editReply({
    content: 'Hm, something went wrong :/',
    components: [],
  });
};
