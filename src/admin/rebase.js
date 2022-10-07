const { fetchAllPlayers } = require('../utilities');
const app = require('../app/core');
const mongo = require('../db');
const admins = require('./list');
const logger = require('../../logger');

module.exports = async function rebase(msg) {
  // only allow admins to execute this command
  if (admins.includes(msg.author.id)) {
    const DBplayers = await fetchAllPlayers();
    // get osrs data
    const data = await app.getRSData(DBplayers);
    // async transaction store
    const results = [];

    // prepare db transactions
    for (let i = 0; i < data.length; i++) {
      const player = data[i];
      // force update DB - TODO: this could probably be insertMany
      results.push(mongo.db.collection('players').updateOne(
        { _id: player.name.toLowerCase() },
        {
          $set: {
            clues: player.clues,
            bosses: player.bosses,
            skills: player.skills,
            updatedAt: new Date(),
          },
        },
      ));
    }

    // execute async db transactions
    await Promise.all(results);

    logger.info(`Hiscore rebase completed. Triggered by ${msg.author.username} (${msg.author.id})`);
    msg.channel.send('All player data rebased against the hiscore table');
  } else {
    // denied
    msg.channel.send('Sorry, you need to be an admin to issue this command');
  }
};
