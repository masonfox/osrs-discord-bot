const { hiscores } = require("osrs-json-api");
const { titleCase, fetchPlayers, timestamp, skillIcon } = require("./utilities");
const { db } = require("./firebase");

/**
 * Main app function
 */
module.exports = async function app() {
  // fetch users to track
  const users = await fetchPlayers();
  // retrieve and format data from OSRS API
  const currentData = await getRSData(users);
  // append any previous data stored for each user
  const filteredData = await getCurrentState(currentData);

  if (filteredData.length > 0) {
    // compare
    const compared = await compareState(filteredData);

    return constructMessage(compared);
  } else {
    return [];
  }
};

/**
 * retrieve and format data based on tracked users from the OSRS API
 * @param {array} users
 * @returns array of user objects with skill data
 */
async function getRSData(users) {
  return Promise.all(
    users.map(async (user) => {
      const data = await hiscores.getPlayer(user.osrsName);
      const path = data.skills;
      const keys = Object.keys(path);
      const final = {
        user,
        current: {},
        previous: {},
      };
      keys.forEach((key) => (final.current[key] = parseInt(path[key].level)));
      return final;
    })
  );
}

async function getCurrentState(data) {
  const filtered = [];
  for (let item of data) {
    let doc = await db.collection("records").doc(item.user.osrsName).get();
    if (doc.exists) {
      let previous = doc.data();
      if (item.current.overall > previous.skills.overall) {
        console.log(`${item.user.osrsName} leveled up!`);
        // we know one of these sub-levels is now higher, pass it along
        item.previous = previous.skills;
        filtered.push(item);
      }
    } else {
      await trackNewPlayer(item);
    }
  }

  return filtered;
}

async function trackNewPlayer(item) {
  await db.collection("records").doc(item.user.osrsName).set({
    skills: item.current,
    updatedAt: timestamp(),
    createdAt: timestamp(),
  });
}

async function compareState(data) {
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

      await transitionState(obj);

      delete obj.current;
      delete obj.previous;

      return { ...obj, results };
    })
  );
}

async function transitionState(data) {
  const { current, previous, user } = data;
  let records = db.collection("records").doc(user.osrsName);
  let history = db.collection("history").doc(user.osrsName);

  await records.update({
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
}

function constructMessage(data) {
  let final = "";
  data.forEach((record, index) => {
    const { user, results } = record;
    let message = `${user.osrsName} leveled up! See skill(s):\n`;

    results.forEach((result) => {
      let { skill, variance, level } = result;
      // construct message
      if (level == 99) {
        // TODO: add a celebrate gif?
        message += `> ${skillIcon(skill)} - **${skill}** is now maxed at 99! Congrats! 🎉\n`;
      } else {
        let levelText = variance > 1 ? "levels" : "level";
        message += `> ${skillIcon(skill)} - **${skill}** increased ${variance} ${levelText} to ${level}!\n`;
      }
    });

    // handle additional spacing
    if ((results.length - 1) !== index) message += "\n";

    final += message;
  });
  return final;
}
