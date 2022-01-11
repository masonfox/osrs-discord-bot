const { hiscores } = require("osrs-json-api");
const {
  titleCase,
  fetchAllPlayers,
  timestamp,
  getResource,
  bossMap,
  fetchGuilds
} = require("./utilities");
const Player = require('./models/player')
const Compare = require('./models/compare')
const client = require("./client");
const { db } = require("./firebase");
const htmlToPng = require("./htmlToPng")

/**
 * Main app function
 */
const main = async function main() {
  // fetch users to track
  const users = await fetchAllPlayers();

  // retrieve and format data from OSRS API
  const currentPlayerState = await getRSData(users);

  // returns consolidated player compare state for those who are eligble
  const progressedPlayers = await getDBState(currentPlayerState);

  if (progressedPlayers.length > 0) {
      const withMessages = constructMessage(progressedPlayers);
      await sendMessages(withMessages)
    } else {
      console.log("No tracked players eligble for updates")
      return [];
  }
};

/**
 * retrieve and format data based on tracked users from the OSRS API
 * @param {array} users
 * @returns array of user objects with skill data
 */
const getRSData = async function getRSData(players) {
  return Promise.all(
    players.map(async (playerObj) => {
      const { skills, bosses, clues } = await hiscores.getPlayer(playerObj.name);

      return new Player(playerObj.name, skills, bosses, clues)
    })
  );
};

const getDBState = async function getDBState(currentStatePlayers) {
  const filtered = [];

  for (let player of currentStatePlayers) {
    let doc = await db.collection("players").doc(player.name.toLowerCase()).get();
    if (doc.exists) {
      let DBState = doc.data()
      let comparison = new Compare(player, DBState)
      if (comparison.hasProgressed) {
        console.log(`${comparison.name} progressed`);

        // we know one of these sub-levels is now higher, pass it along
        filtered.push(comparison);
        
        // update the db with the latest dataset for this user
        await transitionState(comparison);
      }
    } else {
      await trackNewPlayer(item);
    }
  }

  return filtered;
};

const trackNewPlayer = async function trackNewPlayer(item) {
  await db.collection("players").doc(item.name.toLowerCase()).set({
      name: item.name,
      clues: item.clues,
      bosses: item.bosses,
      skills: item.skills,
      createdAt: timestamp()
  })
};

const transitionState = async function transitionState(data) {
  const { current, previous, name } = data;
  let players = db.collection("players").doc(name.toLowerCase());
  let history = db.collection("history").doc(name.toLowerCase());

  // share the timestamp across these updates
  const time = timestamp()

  await players.update({
    skills: current.skills,
    clues: current.clues,
    bosses: current.bosses,
    updatedAt: time,
  });
  await history.collection("records").add({
    version: "v2",
    skills: previous.skills,
    clues: previous.clues,
    bosses: previous.bosses,
    createdAt: time,
  });
  await history.set({
    updatedAt: time,
  });
};

const constructMessage = function constructMessage(data) {
  data.forEach((record, index) => {
    const { name, results } = record;

    // create the base container that everything will nest inside
    let block = `<div class="user-block"><h1 class="player-name">${name}</h1>`

    // build skilsl block, if necessary
    if(record.hasUpdatedSkills) {
      // open a row
      block += "<div class='block-row skills'>"

      // create individual items
      results.skills.forEach((result) => {
        let { skill, variance, level } = result;
        let finalBlock = (level == 99) ? `<h3 class="skill-max">🎉</h3>` : `<h3 class="variance">+${variance}</h3>`;
        record.content[skill] = getResource(skill)
        // construct skill item
        block += `<div class="block-item">
          <div class="block-main">
            <img src="{{${skill}}}" class="skill-icon">
            <h1 class="value">${level}</h1>
            ${finalBlock}
          </div>
        </div>`
      });

      // end skill row
      block += "</div>"
    }

    // build clues block, if necessary
    if(record.hasUpdatedClues) {
      // open a row
      block += "<div class='block-row clues'>"

      results.clues.forEach((result) => {
        let { clueType, score, variance } = result;
        let iconName = `clue_${clueType}`
        record.content[iconName] = getResource(iconName)
        // construct clue item
        block += `<div class="block-item">
          <div class="block-main">
            <img src="{{${iconName}}}" class="skill-icon">
            <h1 class="value">${score}</h1>
            <h3 class="variance">+${variance}</h3>
          </div>
          <small>(${titleCase(clueType)})</small>
        </div>`
      })

      // end clues row
      block += "</div>"
    }

    // build boss block, if necessary
    if(record.hasUpdatedBosses) {
      // open a row
      block += "<div class='block-row bosses'>"

      results.bosses.forEach((result) => {
        let { boss, score, variance } = result;
        record.content[bossMap(boss)] = getResource(bossMap(boss))
        // construct clue item
        block += `<div class="block-item">
          <div class="block-main">
            <img src="{{${bossMap(boss)}}}" class="skill-icon">
            <h1 class="value">${score}</h1>
            <h3 class="variance">+${variance}</h3>
          </div>
          <small>(${boss})</small>
        </div>`
      })

      // end bosses row
      block += "</div>"
    }

    // close the overall block
    block += "</div>"

    // console.log(block)

    record.renderBlock = block;
  });

  return data;
};

const sendMessages = async function sendMessages(players) {
  const guilds = await fetchGuilds(true)

  guilds.forEach(async (guildObj) => {
    let guild = await client.guilds.fetch(guildObj.guildId)
    let channel = await client.channels.fetch(guildObj.channelId)

    // prepare, transform, and send image to channel
    htmlToPng(channel, players)
  })
}

module.exports = {
  main,
  getRSData,
  // getCurrentState,
  trackNewPlayer,
  transitionState,
  constructMessage
};
