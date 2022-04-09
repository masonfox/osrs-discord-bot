require("dotenv").config(); // initialize dotenv
const tracer = require('dd-trace').init();
const logger = require("./logger")
const mongo = require("./src/db")
const { v4: uuid } = require('uuid');
const client = require("./src/client")
const { fetchGuildCount, getTime, addTimeFromNow, validateGuild } = require("./src/utilities")
const { subscribe, unsubscribe, listPlayers, listCommands, addPlayer, removePlayer, statusDump, when, rebase, donate, recapCommand } = require("./src/commands")
const app = require("./src/app/core");
const recap = require("./src/app/recap");
var cron = require('node-cron');

let cronRuns = 1
let nextRun = getTime()
const cronTimes = {
  bihourly: (process.env.NODE_ENV !== "production") ? "*/30 * * * * *" : "0 */2 * * *", // 30 seconds or at minute 0 past every 2nd hour
  weekly: (process.env.NODE_ENV !== "production") ? "*/30 * * * * *" : "0 0 * * MON", // 30 seconds or at 00:00 on Monday
  monthly: (process.env.NODE_ENV !== "production") ? "*/30 * * * * *" : "0 0 1 * *" // 30 seconds or at 00:00 on day-of-month 1
}

/**
 * Ready event handler
 */
client.on("ready", async () => {
  logger.info(`Logged in as ${client.user.tag}!`);
  // launch db Connection
  await mongo.init()
  // launch the bot's functionality
  boot()
});

/**
 * Boots the application
 */
async function boot() {
  const guildCount = await fetchGuildCount(true)
  logger.info(`${guildCount} guilds are subscribed to updates!`)
  // fire app logic
  app.main()
  // increment count
  updateNextRun()
  
  /**
   * Bi-Hourly Cron
   * This runs the standard update cron every 2 hours
   */
  cron.schedule(cronTimes.bihourly, () => {
    logger.info(`The bihourly cron has run ${cronRuns} time${cronRuns > 1 ? "s" : ""}`)
    // fire app logic
    app.main()
    // increment count
    cronRuns += 1
    updateNextRun()
  });

  /**
   * Weekly Cron
   * This runs the weekly recap cron
   */
   cron.schedule(cronTimes.weekly, () => {
    logger.info(`Executing weekly recap!`)
    // fire recap logic
    // recap.main("week")
  });

  /**
   * Monthly Cron
   * This runs the monthly recap cron
   */
   cron.schedule(cronTimes.monthly, () => {
    logger.info(`Executing monthly recap!`)
    // fire recap logic
    // recap.main("month")
  });
}

/**
 * Primary message/command handler
 */
client.on("messageCreate", async (msg) => {
  let { channel, content } = msg

  // create base cmd logger
  const childLogger = logger.child({ 
    instance: uuid(),
    layer: "cmd",
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

  if (content === "!osrs subscribe" || content === "!osrs sub") {
    childLogger.info("!osrs subscribe")
    subscribe(channel)
  } else if (content === "!osrs unsubscribe" || content === "!osrs unsub") {
    childLogger.info("!osrs unsubscribe")
    unsubscribe(channel)
  } else if (content === "!osrs" || content === "!osrs help") {
    childLogger.info("!osrs help")
    listCommands(msg);
  } else if (content === "!osrs list") {
    childLogger.info(content)
    listPlayers(msg)
  } else if (content.includes("!osrs add")) {
    addPlayer(msg)
  } else if (content.includes("!osrs remove")) {
    removePlayer(msg)
  } else if (content.includes("!osrs recap")) {
    let valid = await validateGuild(true, channel)
    if (valid) recapCommand(msg)
  } else if (content === "!osrs status") {
    childLogger.info(content)
    statusDump(channel)
  } else if (content === "!osrs when") {
    childLogger.info(content)
    when(channel, nextRun)
  } else if (content === "!osrs rebase") {
    childLogger.info(content)
    rebase(msg)
  } else if (content === "!osrs donate") {
    childLogger.info(content)
    donate(channel)
  }
});

/**
 * Handles setting and announcing the time the cron will run again
 */
function updateNextRun () {
  nextRun = addTimeFromNow(2, "hour")
  logger.info(`Next update at: ${nextRun}`)
}

// DO NOT MOVE - MUST BE LAST LINE
client.login(process.env.CLIENT_TOKEN); // login bot using token
