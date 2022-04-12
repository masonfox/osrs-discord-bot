const logger = require("../../logger");
const client = require("../client")

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    if (!(interaction.isCommand() || interaction.isSelectMenu())) return;

    const commandName = (interaction.isSelectMenu()) ? interaction.message.interaction.commandName : interaction.commandName
    
    logger.info(`Command executed: ${commandName}`)

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
      if (interaction.isSelectMenu()) {
        await command.handler(interaction, interaction.customId)
      } else {
        await command.execute(interaction)
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
