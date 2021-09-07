require("dotenv").config(); // initialize dotenv
const { Discord, Client, Intents } = require("discord.js");
const { db } = require("./src/firebase");

// command import
const { session, listPlayers, listCommands, addPlayer, removePlayer, statusDump } = require("./src/commands")

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

/**
 * Ready event handler
 */
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // launch the bot's functionality
  boot()
});

/**
 * Boots the application
 */
async function boot() {
  const guild = client.guilds.cache.first()
  const doc = await db.collection("guilds").doc(guild.id).get()
  if (doc.exists && doc.data()?.running) {
    // boot session automatically in silent mode
    const data = doc.data()
    console.log(`Booting to ${data.guildName} / ${data.channelName} channel`)
    const channel = guild.channels.cache.get(data.channelId)
    session.start(channel)
  } else {
    console.log("New instance! Please run '!osrs here'")
  }
}

/**
 * Primary message event handler
 */
client.on("messageCreate", async (msg) => {
  let { channel, content } = msg

  if (content === "!osrs start" || content === "!osrs here") {
    session.start(channel, false)
  } else if (content === "!osrs stop") {
    session.stop(channel)
  } else if (content === "!osrs" || content === "!osrs help") {
    listCommands(msg);
  } else if (content === "!osrs list") {
    listPlayers(msg)
  } else if (content.includes("!osrs add")) {
    addPlayer(msg)
  } else if (content.includes("!osrs remove")) {
    removePlayer(msg)
  } else if (content === "!osrs status") {
    statusDump(channel)
  }
});

// DO NOT MOVE - MUST BE LAST LINE
client.login(process.env.CLIENT_TOKEN); // login bot using token
