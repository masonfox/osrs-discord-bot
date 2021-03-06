const { SlashCommandBuilder } = require('@discordjs/builders');
const mongo = require('../db');

exports.data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('A dump of the OSRS status data for your guild');

exports.execute = async (interaction, logger) => {
  const guild = await mongo.db.collection('guilds').findOne({ _id: interaction.guildId });
  if (guild) {
    const block = '```';
    const message = `OSRS Buddy status for **${guild.guildName}**:\n${`${block}json\n`}${JSON.stringify(guild, null, 2)}\n${block}`; // just dump the entire block, use pretty JSON format

    logger.info('Status block returned', { status: guild });

    return interaction.reply({ content: message, ephemeral: true });
  }

  logger.info('Command escaped - server not subscribed');

  return interaction.reply({ content: "I'm not configured for this server! Use the `!osrs sub` command to kick me off!", ephemeral: true });
};
