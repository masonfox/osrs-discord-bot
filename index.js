require("dotenv").config(); //initialize dotenv
const { Discord, Client, Intents } = require("discord.js"); //import discord.js
const { db } = require("./src/firebase");
const { hiscores } = require("osrs-json-api");
const { titleCase, fetchPlayers } = require("./src/utilities");
var FieldValue = require("firebase-admin").firestore.FieldValue;

// commands
const { listPlayers } = require("./src/commands")

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // app()
});

async function app() {
  // fetch users to track
  const users = await fetchPlayers();
  // retrieve and format data from OSRS API
  const currentData = await getRSData(users);
  // append any previous data stored for each user
  const filteredData = await getCurrentState(currentData);

  if (filteredData.length > 0) {
    // compare
    const compared = await compareState(filteredData);

    return (message = thing(compared));
  } else {
    return [];
  }
}

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
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
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
    updatedAt: FieldValue.serverTimestamp(),
  });
  await history.set({
    updatedAt: FieldValue.serverTimestamp(),
  });
  await history.collection("records").add({
    skills: previous,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function thing(data) {
  let final = "";
  data.forEach((record, index) => {
    const { user, results } = record;
    let message = `${user.osrsName} leveled up! See skill(s):\n`;

    results.forEach((result) => {
      let { skill, variance, level } = result;
      // construct message
      if (level == 99) {
        // add a celebrate gif?
        message += `> - **${skill}** is now maxed at 99! Congrats! 🎉\n`;
      } else {
        let levelText = variance > 1 ? "levels" : "level";
        message += `> - **${skill}** increased ${variance} ${levelText} to ${level}!\n`;
      }
    });

    // handle additional spacing
    if (results.length - 1 !== index) message += "\n";

    final += message;
  });
  return final;
}

async function setDBStatus(running, msg, error = {}) {
  const channel = await client.channels.cache.get(msg.channelId);
  const guild = channel.guild;
  await db.collection("status").doc(channel.id).set({
    running,
    error,
    channelId: channel.id,
    channelName: channel.name,
    guildName: guild.name,
    guildId: guild.id,
    user: msg.author.username,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function listCommands(msg) {
  msg.channel
    .send(`You'll find all of the commands below. You can use a command by entering \`osrs {command}\`!
    > - \`start\` - boots up the script
    > - \`stop\` - stops the script
    > - \`list\` - lists all of the currently tracked players
    > - \`add [osrs name]\` - add a player to track
    > - \`remove [osrs name]\` - remove a tracked player
    > - \`status\` - provide a status dump for this channel`);
}

var interval = null;
const intervalTime = 300000; // 5 minutes

client.on("messageCreate", async (msg) => {
  let guild = msg.guild;

  let channel = msg.channel;
  if (msg.content === "!osrs start") {
    try {
      msg.channel.send(
        `👋 Thanks for setting me up! I'll watch for changes every 5 min! I'll post here in ${channel.name}! You can stop my anytime by typing \`osrs stop\`! Happy leveling!`
      );
      interval = setInterval(async () => {
        let results = await app();
        if (results.length > 0) {
          msg.channel.send(
            `📰 Great news! I have some updates for you:\n\n${results}`
          );
        } else {
          console.log("No results...");
        }
      }, intervalTime);
      await setDBStatus(true, msg);
    } catch (error) {
      msg.channel.send("Hm, I received an error. Please contact the admin");
      await setDBStatus(false, msg, error);
    }
  } else if (msg.content === "!osrs stop") {
    if (interval !== null) {
      clearInterval(interval);
      msg.channel.send(
        "Ah, I get it! I won't pester you anymore! If you change your mind, use `OSRS start` to get rolling again!"
      );
      await setDBStatus(false, msg);
    } else {
      msg.channel.send(
        "Weird, I wasn't actively watching for changes. Make sure you run `osrs start` first! 🤷‍♂️"
      );
    }
  } else if (msg.content === "!osrs" || msg.content === "!osrs help") {
    listCommands(msg);
  } else if (msg.content === "!osrs list") {
    listPlayers(msg)
  }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token
