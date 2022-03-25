const tracer = require('dd-trace').init();
const logger = require("./logger")
require("dotenv").config(); // initialize dotenv
const client = require("./src/client")
const { fetchGuilds } = require("./src/utilities")
const { subscribe, unsubscribe, listPlayers, listCommands, addPlayer, removePlayer, statusDump, when, rebase, donate } = require("./src/commands")
const app = require("./src/app");
const formatInTimeZone = require("date-fns-tz/formatInTimeZone")
const add = require("date-fns/add")
var cron = require('node-cron');

let cronRuns = 1
let nextRun = new Date() 
let cronFrequency = 2 // hours
const cronTime = (process.env.NODE_ENV !== "production") ? "*/30 * * * * *" : `0 */${cronFrequency} * * *`; // 30 seconds or 3 hours

/**
 * Ready event handler
 */
client.on("ready", async () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  // launch the bot's functionality
  boot()
});

/**
 * Boots the application
 */
async function boot() {
  const guilds = await fetchGuilds(true)
  logger.info(`${guilds.length} guilds are subscribed to updates!`)
  // fire app logic
  app.main()
  // increment count
  updateNextRun()
  // start cron on schedule
  cron.schedule(cronTime, () => {
    logger.info(`The cron has run ${cronRuns} time${cronRuns > 1 ? "s" : ""}`)
    // fire app logic
    app.main()
    // increment count
    cronRuns += 1
    updateNextRun()
  });
}

/**
 * Primary message event handler
 */
client.on("messageCreate", async (msg) => {
  let { channel, content } = msg

  // only log relevant messages
  if (content.includes("!osrs")) {
    logger.info("Message created", {
      msg: content,
      author: {
        id: msg.author.id,
        name: msg.author.username
      },
      channel: {
        id: channel.id,
        name: channel.name
      },
      guild: {
        id: channel.guild.id,
        name: channel.guild.name
      }
    })
  }

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
  } else if (content === "!osrs when") {
    when(channel, nextRun)
  } else if (content === "!osrs rebase") {
    rebase(msg)
  } else if (content === "!osrs donate") {
    donate(channel)
  }
});

/**
 * Handles setting and announcing the time the cron will run again
 */
function updateNextRun () {
  nextRun = formatInTimeZone(add(new Date(), { hours: cronFrequency }), "America/New_York", "hh:mm aa (O)")
  logger.info(`Next update at: ${nextRun}`)
}

// DO NOT MOVE - MUST BE LAST LINE
client.login(process.env.CLIENT_TOKEN); // login bot using token
