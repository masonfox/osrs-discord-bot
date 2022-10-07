const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { recap } = require('../app/recap');
const { fetchGuildById, fetchGuildPlayers } = require('../utilities');
const client = require('../client');
const htmlToPng = require('../htmlToPng');

let timeframe = '';

exports.data = new SlashCommandBuilder()
  .setName('recap')
  .setDescription("View a history of a player's updates over a period of time")
  .addStringOption((option) => option
    .setName('timeframe')
    .setDescription('How far back you want to look')
    .addChoice('Day', 'day')
    .addChoice('Week', 'week')
    .addChoice('Month', 'month')
    .setRequired(true));

exports.execute = async (interaction, logger) => {
  // get timeline and store
  timeframe = interaction.options.getString('timeframe');

  // get the guild for validation
  const guild = await fetchGuildById(interaction.guildId);

  // confirm the guild exists
  if (!guild) {
    logger.info('Command escaped - server not subscribed');
    return interaction.editReply({ content: "Hm, this server isn't subscribed yet! Use \`/subscribe\` to get started or re-activate!" });
  }

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
      .setCustomId('recapPlayers')
      .setPlaceholder('Select player')
      .addOptions(playerOptions),
  );

  return interaction.reply({
    content: 'Tracked player to recap:',
    components: [row],
    ephemeral: true,
  });
};

exports.handler = async (interaction, handlerId, logger) => {
  await interaction.deferUpdate();

  const rsn = interaction.values[0];

  logger.info('Command args', { args: { player: rsn, timeframe } });

  const final = await recap([rsn], timeframe);

  if (final.length > 0) {
    const record = final[0];

    logger.info('Recap command data', {
      recapObj: {
        name: record.name,
        currentId: record.current._id,
        previousId: record.previous._id,
        results: record.results,
      },
    });

    const guild = await fetchGuildById(interaction.guildId);
    const channel = client.channels.cache.get(guild.channelId);
    htmlToPng(channel, `Ad-hoc **${timeframe}** recap for **${rsn}**! Requested by ${interaction.user.username}.`, [], final);
    return interaction.editReply({
      content: `Sending recap to <#${guild.channelId}>`,
      components: [],
    });
  }

  logger.info('Not enough recap data for player');

  return interaction.editReply({
    content: "We don't show any history for this player in this timeframe. Either try a different timeframe or try again later!",
    components: [],
  });
};
