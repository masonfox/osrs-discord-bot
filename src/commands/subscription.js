const { timestamp } = require("../utilities");
const { db } = require("../firebase");

exports.subscribe = async function subscribe(channel) {
  const guild = channel.guild;
  await db.collection("guilds").doc(guild.id).set({
    subscribed: true,
    channelId: channel.id,
    channelName: channel.name,
    guildName: guild.name,
    guildId: guild.id,
    players: [],
    updatedAt: timestamp()
  });

  // notify
  channel.send(`👋 Thanks for setting me up! I'll watch for changes every 5 min! I'll post here in ${channel.name}! Happy leveling!`)
};

exports.unsubscribe = async function unsubscribe(channel) {
  const guild = channel.guild;
  
  // update the guild document - will not run next tick
  await db.collection("guilds").doc(guild.id).update({
    subscribed: false,
    updatedAt: timestamp()
  });

  // notify
  channel.send("I won't pester you anymore! If you change your mind, use `sub` to get rolling again!");
};
