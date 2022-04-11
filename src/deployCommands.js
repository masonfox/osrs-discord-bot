const client = require("./client");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const rest = new REST({ version: '9' }).setToken(process.env.CLIENT_TOKEN);

/**
 * Deploys slash commands through the Discord API
 */
module.exports = async function deployCommands() {
  try {
    console.log("Started refreshing application (/) commands.");

    // reduce command objects down to builder info
    const commands = client.commands.map((command) => command.data);

    if (process.env.NODE_ENV == "production") {
      
    } else {
        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.TEST_DISCORD_GUILD_ID), {
            body: commands,
        });
    }

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error attempting to update slash commands: ", error);
  }
};
