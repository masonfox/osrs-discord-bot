const { fetchAllPlayers } = require("../utilities");
const app = require("../app/core");
const mongo = require("../db");

const admins = ["397044534988636161"];

module.exports = async function rebase(msg) {
  //
  if (admins.includes(msg.author.id)) {
    const DBplayers = await fetchAllPlayers();
    // get osrs data
    const data = await app.getRSData(DBplayers);
    // update
    for (let i = 0; i < data.length; i++) {
      let player = data[i];
      // force update DB - TODO: this could probably be insertMany
      await mongo.db.collection("players").updateOne(
        { _id: player.name.toLowerCase() },
        {
          $set: {
            clues: player.clues,
            bosses: player.bosses,
            skills: player.skills,
            updatedAt: new Date(),
          },
        }
      );
    }
    msg.channel.send("All player data rebased against the hiscore table");
  } else {
    // denied
    channel.send("Sorry, you need to be an admin to issue this command");
  }
};
