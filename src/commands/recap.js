const { SlashCommandBuilder } = require('@discordjs/builders');
const { recap } = require('../app/recap');
const { fetchGuildById } = require('../utilities');
const client = require('../client');
const htmlToPng = require('../htmlToPng');

exports.data = new SlashCommandBuilder()
  .setName('recap')
  .setDescription("View a history of a player's updates over a period of time")
  .addStringOption((option) => option
    .setName('rsn')
    .setDescription('The OSRS player name')
    .setRequired(true))
  .addStringOption((option) => option
    .setName('timeframe')
    .setDescription('How far back you want to look')
    .addChoice('Day', 'day')
    .addChoice('Week', 'week')
    .addChoice('Month', 'month')
    .setRequired(true));

exports.execute = async (interaction, logger) => {
  await interaction.deferReply({ ephemeral: true });
  // get options
  const timeframe = interaction.options.getString('timeframe');
  const rsn = interaction.options.getString('rsn');
  const rsnLowered = rsn.toLowerCase();

  logger.info('Command args', { args: { player: rsnLowered, timeframe } });

  // get the guild for validation
  const guild = await fetchGuildById(interaction.guildId);

  // confirm the guild exists
  if (!guild) {
    logger.info('Command escaped - server not subscribed');
    return interaction.editReply({ content: "Hm, this server isn't subscribed yet! Use \`/subscribe\` to get started or re-activate!" });
  }

  const final = await recap([rsnLowered], timeframe);

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

    const channel = client.channels.cache.get(guild.channelId);
    htmlToPng(channel, `Ad-hoc **${timeframe}** recap for **${rsn}**!`, [], final);
    return interaction.editReply(`Sending recap to <#${guild.channelId}>`);
  }

  logger.info('Not enough recap data for command');

  return interaction.editReply("We don't show any history for this player in this timeframe. Either try a different timeframe or try again later!");
};
