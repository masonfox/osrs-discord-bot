require('dotenv').config();
const app = require("../app");

var interval = null;
const intervalTime = (process.env.NODE_ENV == "production") ? 300000 : 10000; // 5 minutes or 10 seconds

const start = async function start(channel, silent = true) {
  try {
    if (interval !== null) return channel.send("I am already running!");
    // send a welcome!
    if (!silent) channel.send( `👋 Thanks for setting me up! I'll watch for changes every 5 min! I'll post here in ${channel.name}! Happy leveling!`);
    // start interval for main app function
    interval = setInterval(async () => {
      let results = await app.main();
      if (results.length > 0) {
        channel.send(
          `📰 Great news! I have some updates for you:\n\n${results}`
        );
      } else {
        console.log("No results...");
      }
    }, intervalTime);
    await app.setDBGuild(true, channel);
  } catch (error) {
    channel.send("Hm, I received an error. Please contact the admin");
    await app.setDBGuild(false, channel, error);
  }
};

const stop = async function stop(channel) {
  if (interval !== null) {
    clearInterval(interval);
    channel.send(
      "Ah, I get it! I won't pester you anymore! If you change your mind, use `OSRS start` to get rolling again!"
    );
    await app.setDBGuild(false, channel);
  } else {
    channel.send(
      "Weird, I wasn't actively watching for changes. Make sure you run `osrs start` first! 🤷‍♂️"
    );
  }
};

module.exports = {
  interval,
  intervalTime,
  start,
  stop,
};
