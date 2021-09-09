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
    updatedAt: timestamp()
  });
};

exports.unsubscribe = async function unsubscribe(channel) {
  const guild = channel.guild;
  await db.collection("guilds").doc(guild.id).update({
    subscribed: false,
    updatedAt: timestamp()
  });
};
