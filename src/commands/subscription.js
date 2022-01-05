const { timestamp } = require("../utilities");
const { db } = require("../firebase");

exports.subscribe = async function subscribe(channel) {
  const guild = channel.guild;

  // look for any existing players and maintain them
  const record = await db.collection("guilds").doc(guild.id).get()
  const players = (record.exists) ? record.data().players : []
  const createdAt = (record.exists) ? record.data().createdAt : timestamp()

  // set guild - will run next tick
  await db.collection("guilds").doc(guild.id).set({
    players,
    createdAt,
    subscribed: true,
    channelId: channel.id,
    channelName: channel.name,
    guildName: guild.name,
    guildId: guild.id,
    updatedAt: timestamp()
  });

  // notify
  channel.send(`👋 Thanks for setting me up! I'll watch for changes every 2 hours! I'll post here in ${channel.name}! Happy leveling!`)
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
