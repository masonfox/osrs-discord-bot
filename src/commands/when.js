const { SlashCommandBuilder } = require('@discordjs/builders');
const { runs } = require('../app/core');

exports.data = new SlashCommandBuilder()
  .setName('when')
  .setDescription('Shares when the next bi-hourly update will run');

exports.execute = async (interaction) => {
  await interaction.reply({
    content: `I will run at: ${runs.next}`,
    ephemeral: true,
  });
};
