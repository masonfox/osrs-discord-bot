require('dotenv').config(); // initialize dotenv
const tracer = require('dd-trace').init();
const { v4: uuid } = require('uuid');
const { Collection } = require('discord.js');
const fs = require('fs');
const logger = require('./logger');
const client = require('./src/client');
const { validateGuild } = require('./src/utilities');
const {
  listCommands,
  rebase,
} = require('./src/commands');

// NEW
const deployCommands = require('./src/deployCommands');

/**
 * Read and attach commands to Discord client from the slash-commands folder
 */
client.commands = new Collection();

const commandFiles = fs.readdirSync('./src/slashCommands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./src/slashCommands/${file}`);
  logger.info(`Command loaded: ${file}`);
  client.commands.set(command.data.name, command);
}

/**
 * Read and create handlers for events in events folders
 */
const eventFiles = fs.readdirSync('./src/events/').filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./src/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

/**
 * Primary message/command handler
 * TODO: This should be moved to the events folder
 */
client.on('messageCreate', async (msg) => {
  const { channel, content } = msg;

  // create base cmd logger
  const childLogger = logger.child({
    instance: uuid(),
    layer: 'cmd',
    author: {
      id: msg.author.id,
      name: msg.author.username,
    },
    channel: {
      id: channel.id,
      name: channel.name,
    },
    guild: {
      id: channel.guild.id,
      name: channel.guild.name,
    },
  });

  if (content === '!osrs' || content === '!osrs help') {
    childLogger.info('!osrs help');
    listCommands(msg);
  } else if (content === '!osrs rebase') {
    childLogger.info(content);
    rebase(msg);
  }
});

// deploy slash commands
deployCommands();

// DO NOT MOVE - MUST BE LAST LINE
client.login(process.env.CLIENT_TOKEN); // login bot using token
