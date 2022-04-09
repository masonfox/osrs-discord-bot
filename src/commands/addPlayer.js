const { hiscores } = require("osrs-json-api");
const mongo = require("../db");
const app = require("../app/core");

module.exports = async function addPlayer(msg) {
  let { channel, content, author } = msg;
  let arr = content.split(" ");

  /**
   * Validation Logic
   */
  // ensure a name is provided
  if (arr.length == 2)
    return channel.send("I think you forgot a name after `add`!");

  // validate double quotes
  if (!content.includes('"'))
    return channel.send('Encase the name in double quotes! Example: "Zezima"');

  // grab the rsn between then quotes
  const name = content
    .substring(content.indexOf('"') + 1, content.lastIndexOf('"'))
    .trim();

  // lower name - this is used as the id for the players collection
  let nameLowered = name.toLowerCase();

  // determine if the player exists in general
  try {
    await hiscores.getPlayer(name);
  } catch (error) {
    return channel.send(
      `I wasn't able to find a player named **${name}** in the OSRS hiscores. :/`
    );
  }

  // confirm guild subscription exists
  const guild = await mongo.db
    .collection("guilds")
    .findOne({ _id: channel.guild.id });

  // confirm the guilds exists and that they're subscribed to updates
  if (guild && guild?.subscribed) {
    /**
     * Addition Logic
     */
    // see if they already exist in the players collection
    const player = await mongo.db
      .collection("players")
      .findOne({ _id: nameLowered });

    // if they don't exist in the players collection, add them
    if (!player) {
      // get RS data results and insert the player
      console.log(`"${name}" added to collection`);
      await insertNewPlayer(name);
    }

    // see if they're already tracking this user
    if (guild.players.includes(nameLowered))
      return msg.channel.send(
        `You're already tracking **${name}**! No worries!`
      );

    // update guilds tracking list
    await mongo.db.collection("guilds").updateOne(
      { _id: channel.guild.id },
      {
        $addToSet: { players: nameLowered },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(`${name} now tracked by ${guild.guildName} guild in ${guild.channelName} channel`)

    // send success message
    msg.channel.send(
      `🎉 **${name}** successfully added! I'll begin tracking them!`
    );
  } else {
    // server isn't subscribed - ask them too
    msg.channel.send(
      "Hm, this server isn't subscribed yet! Use `!osrs sub` to get started or re-activate!"
    );
  }
};

async function insertNewPlayer(name) {
  const data = await app.getRSData([{ name }]);
  await app.trackNewPlayer(data[0]);
}
