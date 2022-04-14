const { SlashCommandBuilder } = require('@discordjs/builders');

const donationURL = 'https://www.buymeacoffee.com/osrsbuddy/';

exports.data = new SlashCommandBuilder()
  .setName('donate')
  .setDescription('Info. about donating ❤️');

exports.execute = async (interaction) => {
  await interaction.reply({
    content: `Thank you for your interest in donating to OSRS Buddy Bot! Anything you feel compelled to donate is appreciated - *nothing is too small!* ${donationURL}`,
    ephemeral: true,
  });
};
