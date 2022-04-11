const { SlashCommandBuilder } = require('@discordjs/builders');

exports.data = new SlashCommandBuilder()
	.setName('echo')
	.setDescription('Shows you the current bot ping')
	.addStringOption(option =>
		option.setName('input')
			.setDescription('The input to echo back')
			.setRequired(true));

exports.execute = async (interaction) => {
    const val = interaction.options.getString("input")
    interaction.reply(`Yup, you said: ${val}`)
}