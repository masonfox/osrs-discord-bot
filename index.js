require("dotenv").config(); // initialize dotenv
const { db } = require("./src/firebase");
const client = require("./src/client")
const { fetchGuilds } = require("./src/utilities")
const { session, subscribe, unsubscribe, listPlayers, listCommands, addPlayer, removePlayer, statusDump } = require("./src/commands")
const app = require("./src/app");
var cron = require('node-cron');

const cronTime = (process.env.NODE_ENV !== "production") ? "*/10 * * * * *" : "*/5 * * * *"; // 10 seconds or 5 minutes
let cronRuns = 1

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
  const guilds = await fetchGuilds(true)
  console.log(`${guilds.length} guilds are subscribed to updates!`)
  // run app immediately
  app.main()
  // cron.schedule(cronTime, () => {
  //   console.log(`The cron has run ${cronRuns} time(s)`)
  //   // begin app logic
    
  //   // increment count
  //   cronRuns += 1
  // });
  // const guild = client.guilds.cache.first()
  // const doc = await db.collection("guilds").doc(guild.id).get()
  // if (doc.exists && doc.data()?.running) {
  //   // boot session automatically in silent mode
  //   const data = doc.data()
  //   console.log(`Booting to ${data.guildName} / ${data.channelName} channel`)
  //   const channel = guild.channels.cache.get(data.channelId)
  //   session.start(channel)
  // } else {
  //   console.log("New instance! Please run '!osrs here'")
  // }
}

/**
 * Primary message event handler
 */
client.on("messageCreate", async (msg) => {
  let { channel, content } = msg

  if (content === "!osrs subscribe" || content === "!osrs sub") {
    subscribe(channel)
  } else if (content === "!osrs unsubscribe" || content === "!osrs unsub") {
    unsubscribe(channel)
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
