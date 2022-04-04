const mongo = require("../db");

module.exports = async function removePlayer(msg) {
  let { channel, content } = msg;
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

  // confirm guild subscription exists
  const guild = await mongo.db
    .collection("guilds")
    .findOne({ _id: channel.guild.id });

  // confirm the guilds exists and that they're subscribed to updates
  if (guild) {
    // bounce if the guild isn't tracking this player anyway
    if (!guild.players.includes(nameLowered))
      return msg.channel.send(
        "You're not tracking this player anyway! No worries!"
      );

    /**
     * Remove the player and send msg
     */
    // remove player from guild tracking
    await mongo.db.collection("guilds").updateOne(
      { _id: channel.guild.id },
      {
        $pull: { players: nameLowered },
      }
    );

    // send message with for removal confirmation
    msg.channel.send(
      `Player **${name}** has been successfully removed! Queue their viking burial! ⚰️🔥`
    );

    /**
     * Clean up
     */
    // find if the player is located anywhere else
    const otherGuilds = await mongo.db
      .collection("guilds")
      .find({ players: nameLowered })
      .toArray();

    // if they're not tracked by other guilds, delete them
    if (otherGuilds.length == 0) {
      console.log(
        `Deleting ${name} from player collection, no guilds tracking`
      );
      await mongo.db.collection("players").deleteOne({ _id: nameLowered }); // delete player record
      // await mongo.db.collection("history").deleteOne({ _id: nameLowered }) // delete history record
    } else {
      console.log(
        `${name} removed from ${channel.guild.id}, but not from collection`,
        otherGuilds
      );
    }
  } else {
    return msg.channel.send(
      "This server isn't subscribed, so you don't have any tracked players!"
    );
  }
};
