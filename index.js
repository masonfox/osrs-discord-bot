require("dotenv").config(); //initialize dotenv
const { Discord, Client, Intents } = require("discord.js"); //import discord.js
const { db } = require("./src/firebase");
const app = require("./src/app")
const { timestamp } = require("./src/utilities")

// commands
const { start, listPlayers, listCommands } = require("./src/commands")

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

async function setDBStatus(running, msg, error = {}) {
  const channel = await client.channels.cache.get(msg.channelId);
  const guild = channel.guild;
  await db.collection("status").doc(channel.id).set({
    running,
    error,
    channelId: channel.id,
    channelName: channel.name,
    guildName: guild.name,
    guildId: guild.id,
    user: msg.author.username,
    updatedAt: timestamp(),
  });
}

var interval = null;
const intervalTime = 300000; // 5 minutes

/**
 * Primary message event handler
 */
client.on("messageCreate", async (msg) => {
  let { guild, channel, content } = msg 

  if (content === "!osrs start") {
    try {
      msg.channel.send(
        `👋 Thanks for setting me up! I'll watch for changes every 5 min! I'll post here in ${channel.name}! You can stop my anytime by typing \`osrs stop\`! Happy leveling!`
      );
      interval = setInterval(async () => {
        let results = await app();
        if (results.length > 0) {
          msg.channel.send(
            `📰 Great news! I have some updates for you:\n\n${results}`
          );
        } else {
          console.log("No results...");
        }
      }, intervalTime);
      await setDBStatus(true, msg);
    } catch (error) {
      msg.channel.send("Hm, I received an error. Please contact the admin");
      await setDBStatus(false, msg, error);
    }
  } else if (content === "!osrs stop") {
    if (interval !== null) {
      clearInterval(interval);
      msg.channel.send(
        "Ah, I get it! I won't pester you anymore! If you change your mind, use `OSRS start` to get rolling again!"
      );
      await setDBStatus(false, msg);
    } else {
      msg.channel.send(
        "Weird, I wasn't actively watching for changes. Make sure you run `osrs start` first! 🤷‍♂️"
      );
    }
  } else if (content === "!osrs" || msg.content === "!osrs help") {
    listCommands(msg);
  } else if (content === "!osrs list") {
    listPlayers(msg)
  }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token
