const { db } = require("./firebase");

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
exports.fetchPlayers = async function fetchPlayers() {
  const snapshot = await db.collection("users").get();
  return snapshot.docs.map((doc) => doc.data());
};
