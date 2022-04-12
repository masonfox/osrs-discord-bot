require("dotenv").config(); // initialize dotenv
const tracer = require("dd-trace").init();
const logger = require("./logger");
const { v4: uuid } = require("uuid");
const client = require("./src/client");
const { Collection } = require("discord.js");
const { validateGuild } = require("./src/utilities");
const {
  subscribe,
  unsubscribe,
  listPlayers,
  listCommands,
  addPlayer,
  removePlayer,
  when,
  rebase,
  recapCommand,
} = require("./src/commands");

// NEW
const fs = require("fs");
const deployCommands = require("./src/deployCommands");

/**
 * Read and attach commands to Discord client from the slash-commands folder
 */
client.commands = new Collection();

const commandFiles = fs.readdirSync("./src/slashCommands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./src/slashCommands/${file}`);
  logger.info(`Command loaded: ${file}`);
  client.commands.set(command.data.name, command);
}

/**
 * Read and create handlers for events in events folders
 */
const eventFiles = fs.readdirSync("./src/events/").filter((f) => f.endsWith(".js"));

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
client.on("messageCreate", async (msg) => {
  let { channel, content } = msg;

  // create base cmd logger
  const childLogger = logger.child({
    instance: uuid(),
    layer: "cmd",
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

  if (content === "!osrs subscribe" || content === "!osrs sub") {
    childLogger.info("!osrs subscribe");
    subscribe(channel);
  } else if (content === "!osrs unsubscribe" || content === "!osrs unsub") {
    childLogger.info("!osrs unsubscribe");
    unsubscribe(channel);
  } else if (content === "!osrs" || content === "!osrs help") {
    childLogger.info("!osrs help");
    listCommands(msg);
  } else if (content === "!osrs list") {
    childLogger.info(content);
    listPlayers(msg);
  } else if (content.includes("!osrs add")) {
    addPlayer(msg);
  } else if (content.includes("!osrs remove")) {
    removePlayer(msg);
  } else if (content.includes("!osrs recap")) {
    let valid = await validateGuild(true, channel);
    if (valid) recapCommand(msg);
  } else if (content === "!osrs when") {
    childLogger.info(content);
    when(channel, nextRun);
  } else if (content === "!osrs rebase") {
    childLogger.info(content);
    rebase(msg);
  }
});

// deploy slash commands
deployCommands();

// DO NOT MOVE - MUST BE LAST LINE
client.login(process.env.CLIENT_TOKEN); // login bot using token
