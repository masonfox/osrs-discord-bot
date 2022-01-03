const { hiscores } = require("osrs-json-api");
const {
  titleCase,
  fetchAllPlayers,
  timestamp,
  skillIcon,
  fetchGuilds
} = require("./utilities");
const Player = require('./models/player')
const Compare = require('./models/compare')
const client = require("./client");
const { db } = require("./firebase");

/**
 * Main app function
 */
const main = async function main() {
  // fetch users to track
  const users = await fetchAllPlayers();

  // retrieve and format data from OSRS API
  const currentPlayerState = await getRSData(users);

  // returns consolidated player compare state for those who are eligble
  const filteredPlayerStates = await getDBState(currentPlayerState);

  if (filteredPlayerStates.length > 0) {
      console.log('YUP')
      // compare
      const compared = await compareState(filteredPlayerStates);

      console.log(compared[0].results)

      // const withMessages = constructMessage(compared);

      // await sendMessages(withMessages)
    } else {
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

const getDBState = async function getDBState(currentState) {
  const filtered = [];

  for (let item of currentState) {
    let doc = await db.collection("players").doc(item.name.toLowerCase()).get();
    if (doc.exists) {
      let DBState = doc.data()
      if (item.skills.overall > DBState.skills.overall) {
        console.log(`${item.name} leveled up!`);
        // we know one of these sub-levels is now higher, pass it along
        filtered.push(new Compare(item, DBState));
      }
    } else {
      await trackNewPlayer(item);
    }
  }

  return filtered;
};

const trackNewPlayer = async function trackNewPlayer(item) {
  await db.collection("players").doc(item.playerName.toLowerCase()).set({
      name: item.playerName,
      skills: item.current,
      createdAt: timestamp()
  })
};

const compareState = async function compareState(data) {
  return Promise.all(
    data.map(async (obj) => {
      let { previous, current } = obj;
      let keys = Object.keys(obj.current);
      let results = [];

      keys.forEach((key) => {
        if (previous[key] !== current[key] && key !== "overall") {
          // prepare results
          results.push({
            skill: titleCase(key),
            variance: parseInt(current[key]) - parseInt(previous[key]),
            level: current[key],
          });
        }
      });

      // await transitionState(obj);

      delete obj.current;
      delete obj.previous;

      return { ...obj, results };
    })
  );
};

const transitionState = async function transitionState(data) {
  const { current, previous, playerName } = data;
  let players = db.collection("players").doc(playerName.toLowerCase());
  let history = db.collection("history").doc(playerName.toLowerCase());

  await players.update({
    skills: current,
    updatedAt: timestamp(),
  });
  await history.set({
    updatedAt: timestamp(),
  });
  await history.collection("records").add({
    skills: previous,
    createdAt: timestamp(),
  });
};

const constructMessage = function constructMessage(data) {
  data.forEach((record, index) => {
    const { playerName, results } = record;
    let message = `**${playerName}** leveled up! See skill(s):\n`;

    record.message = ""

    results.forEach((result) => {
      let { skill, variance, level } = result;
      // construct message
      if (level == 99) {
        // TODO: add a celebrate gif?
        message += `> ${skillIcon(skill)} - **${skill}** is now maxed at **99**! Congrats! 🎉\n`;
      } else {
        let levelText = variance > 1 ? "levels" : "level";
        message += `> ${skillIcon(skill)} - ${skill} increased ${variance} ${levelText} to ${level}!\n`;
      }
    });

    // add spacer between message blocks - Discord handles trimming any straggling ones
    message += "\n"

    record.message += message;
  });

  return data;
};

const sendMessages = async function sendMessages(players) {
  const guilds = await fetchGuilds(true)

  guilds.forEach((guildObj) => {
    let guild = client.guilds.cache.get(guildObj.guildId)
    let channel = guild.channels.cache.get(guildObj.channelId)
    // only return the players that leveled up that are being tracked on this server
    let filteredPlayers = players.filter(player => guildObj.players.includes(player.playerName.toLowerCase()))

    // if there are results, we need to announce them, otherwise, stay silent
    if(filteredPlayers.length > 0) {
      let finalMessage = "📰 Great news! I have some updates for you:\n\n"
      filteredPlayers.forEach(player => finalMessage += player.message)
      channel.send(finalMessage);
    }
  })
}

module.exports = {
  main,
  getRSData,
  // getCurrentState,
  trackNewPlayer,
  compareState,
  transitionState,
  constructMessage
};
