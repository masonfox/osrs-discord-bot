const { db } = require("./firebase");
var FieldValue = require("firebase-admin").firestore.FieldValue;

/**
 * Returns the input string as title case
 * @param {string} str 
 */
exports.titleCase = function titleCase(str) {
  str = str.toLowerCase();
  str = str.split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
};

/**
 * Retrieve the the players from the DB
 * @returns {array} of players
 */
exports.fetchAllPlayers = async function fetchPlayers() {
  const snapshot = await db.collection("players").get();
  return snapshot.docs.map((doc) => doc.data());
};

/**
 * Retrieve the the players from the DB for a specific guild
 * @returns {array} of players
 */
 exports.fetchGuildPlayers = async function fetchGuildPlayers(guildId) {
  const doc = await db.collection("guilds").doc(guildId).get();
  return doc.data().players;
};

/**
 * Retrieve all of the guilds stored in the DB
 * @returns {array} of guilds docs
 */
 exports.fetchGuilds = async function fetchGuilds(subscribed = false) {
  let snapshot = null;
  if (subscribed) {
    snapshot = await db.collection("guilds").where("subscribed", "=", true).get()
  } else {
    snapshot = await db.collection("guilds").get()
  }
  return snapshot.docs.map((doc) => doc.data())
}

/**
 * Retrieve current server time from FB for timestamps
 * @returns {timestamp}
 */
exports.timestamp = function timestamp() {
  return FieldValue.serverTimestamp()
}

exports.skillIcon = function skillIcon(skill) {
  const icons = {
    agility: "🏃‍♂️",
    attack: "⚔",
    construction: "🔨",
    cooking: "🍲",
    crafting: "⚒",
    defence : "🛡",
    farming: "🌱",
    firemaking: "🔥",
    fishing: "🎣",
    fletching: "🔪",
    herblore: "🌿",
    hitpoints: "♥",
    hunter: "🐾",
    magic: "🧙‍♂️",
    mining: "⛏",
    prayer: "🙏",
    ranged: "🏹",
    runecraft: "💎",
    slayer: "💀",
    smithing: "♨",
    strength: "💪",
    thieving: "💰",
    woodcutting: "🌲",
  }

  return icons[skill.toLowerCase()]
}