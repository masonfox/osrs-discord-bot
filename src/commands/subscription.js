const mongo = require("../db");

exports.subscribe = async function subscribe(channel) {
  const guild = channel.guild;
  const query = { guildId: guild.id };

  // look for any existing config and maintain
  const record = await mongo.db.collection("guilds").findOne(query);
  const players = record ? record.players : [];
  const createdAt = record ? record.createdAt : new Date();

  const data = {
    _id: guild.id,
    players,
    createdAt,
    subscribed: true,
    channelId: channel.id,
    channelName: channel.name,
    guildName: guild.name,
    guildId: guild.id,
    updatedAt: new Date(),
  };

  // set guild - will run next tick
  await mongo.db
    .collection("guilds")
    .updateOne(query, { $set: data }, { upsert: true });

  // notify
  channel.send(
    `👋 Thanks for setting me up! I'll watch for changes every 2 hours! I'll post here in ${channel.name}! Happy leveling!`
  );
};

exports.unsubscribe = async function unsubscribe(channel) {
  const guild = channel.guild;

  // update the guild document - will not run next tick
  await mongo.db.collection("guilds").updateOne(
    { _id: guild.id },
    {
      $set: {
        subscribed: false,
        updatedAt: new Date(),
      }
    }
  );

  // notify
  channel.send(
    "I won't pester you anymore! If you change your mind, use `sub` to get rolling again!"
  );
};
