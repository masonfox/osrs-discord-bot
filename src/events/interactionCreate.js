const logger = require('../../logger');
const client = require('../client');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    if (!(interaction.isCommand() || interaction.isSelectMenu())) return;

    // TODO: enforce a block/bank list

    const commandName = (interaction.isSelectMenu()) ? interaction.message.interaction.commandName : interaction.commandName;

    logger.info(`Command attempt: ${commandName}`);

    const command = client.commands.get(commandName);

    if (!command) return;

    // create base command logger
    const childLogger = logger.child({
      instance: interaction.id,
      command: commandName,
      layer: 'cmd',
      author: {
        id: interaction.user.id,
        name: interaction.user.username,
      },
      guild: {
        id: interaction.member.guild.id,
        name: interaction.member.guild.name,
      },
    });

    try {
      if (interaction.isSelectMenu()) {
        childLogger.info(`Executing command handler: ${commandName}`);
        await command.handler(interaction, interaction.customId, childLogger);
      } else {
        childLogger.info(`Executing command: ${commandName}`);
        await command.execute(interaction, childLogger);
      }
    } catch (error) {
      logger.error(`Error executing a command: ${error}`);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  },
};
