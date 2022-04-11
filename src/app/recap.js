const mongo = require("../db");
const dayjs = require("dayjs");
const Compare = require("../models/compare");
const { constructMessage } = require("../app/core");
const client = require("../client");
const htmlToPng = require("../htmlToPng");
const { fetchAllPlayerIds, fetchGuilds, titleCase } = require("../utilities");

const main = async function main(timeframe) {
  // grab players
  const players = await fetchAllPlayerIds();

  // prepare
  const final = await recap(players, timeframe)

  // console.log(final)

  // send
  if (final.length > 0) {
    await sendRecapMessages(final, timeframe)
  }
}

const recap = async function recap(players, timeframe) {
  if (typeof players !== "array") new Error("Players param must be an array");
  if (!["day", "week", "month"].includes(timeframe))
    new Error("Timeframe command must be: 'day', 'week', or 'month'");

  const date = new Date(dayjs().subtract(1, timeframe));

  // grab all of the user's history records
  const histories = await mongo.db
    .collection("history")
    .aggregate([
      {
        $match: {
          playerId: {
            $in: [...players], // array of playerId's
          },
          createdAt: {
            $gte: date,
            $lt: new Date(),
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: "$playerId",
          latest: { $first: "$$ROOT" },
          oldest: { $last: "$$ROOT" }
        }
      }
    ])
    .toArray();

  if (histories.length == 0) return [] // jump out
  
  let compared = []

  for (let index = 0; index < histories.length; index++) {
    const { latest, oldest } = histories[index];

    if (latest.createdAt.toString() === oldest.createdAt.toString()) {
      let compare = new Compare(latest, oldest)
      compare.results = latest.delta
      compared.push(compare)
    } else {
      compared.push(new Compare(latest, oldest))
    }
  }

  return constructMessage(compared);
};

const sendRecapMessages = async function sendRecapMessages (players, timeframe) {
  const guilds = await fetchGuilds(true);

  for (let index = 0; index < guilds.length; index++) {
    const guildObj = guilds[index];

    let channel = await client.channels.fetch(guildObj.channelId);

    let guildPlayers = players.filter((player) => {
      return guildObj.players.includes(player.name.toLowerCase());
    });

    // only generate a response for servers where players they track progressed
    if (guildPlayers.length > 0) {
      // prepare, transform, and send image to channel
      htmlToPng(channel, `**${titleCase(timeframe)}ly** recap!`, [], guildPlayers);
    }
  }
}

module.exports = {
  main,
  recap,
  sendRecapMessages
}