const { db } = require("./firebase");
const mongo = require("./db")
const path = require("path")
const fs = require('fs')
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
  return mongo.db.collection("players").find().toArray();
};

/**
 * Retrieve the the players from the DB for a specific guild
 * @returns {array} of players
 */
 exports.fetchGuildPlayers = async function fetchGuildPlayers(guildId) {
  const guild = await mongo.db.collection("guilds").findOne({ _id: guildId });
  return (guild) ? guild.players : []
};

/**
 * Retrieve all of the guilds stored in the DB
 * @returns {array} of guilds docs
 */
 exports.fetchGuilds = async function fetchGuilds(subscribed = false) {
  if (subscribed) {
    return mongo.db.collection("guilds").find({ subscribed: true }).toArray()
  } else {
    return await mongo.db.collection("guilds").find().toArray()
  }
}

/**
 * Retrieve all of the guilds stored in the DB
 * @returns {array} of guilds docs
 */
 exports.fetchGuildCount = async function fetchGuildCount(subscribed = false) {
  if (subscribed) {
    return mongo.db.collection("guilds").count({ subscribed: true })
  } else {
    return await mongo.db.collection("guilds").count()
  }
}

/**
 * Retrieve current server time from FB for timestamps
 * @returns {timestamp}
 */
exports.timestamp = function timestamp() {
  return FieldValue.serverTimestamp()
}

/**
 * Returns a dataUri/base64 of the file int he resource directory
 * @param {string} resourceName 
 */
exports.getResource = function getResource(resourceName) {
  const iconPath = path.join(__dirname, '/resources/icons/') + resourceName + ".png"
  const image = fs.readFileSync(iconPath)
  const base64 = new Buffer.from(image).toString('base64')
  return 'data:image/png;base64,' + base64
}

/**
 * Calculates the combat level of a player
 * @param {object} skills 
 * @returns combat level, number
 */
exports.combatLevel = function combatLevel(skills) {
  let base = .25 * (skills.defence + skills.hitpoints + (skills.prayer *.5))
  let melee = .325 * (skills.attack + skills.strength)
  let ranged = .325 * (skills.ranged * 1.5)
  let magic = .325 * (skills.magic * 1.5)
  let max = Math.max(melee, ranged, magic)
  let final = Math.floor(base + max)
  return (isNaN(final)) ? "Error" : final
}

exports.bossMap = function bossMap(bossName) {
  const map = {
      "Abyssal Sire": "abyssal_sire",
      "Alchemical Hydra": "alchemical_hydra",
      "Barrows Chests": "barrows_chests",
      "Bryophyta": "bryophyta",
      "Callisto": "callisto",
      "Cerberus": "cerberus",
      "Chambers of Xeric": "chambers_of_xeric",
      "Chambers of Xeric: Challenge Mode": "chambers_of_xeric_challenge_mode",
      "Chaos Elemental": "chaos_elemental",
      "Chaos Fanatic": "chaos_fanatic",
      "Commander Zilyana": "commander_zilyana",
      "Corporeal Beast": "corporeal_beast",
      "Crazy Archaeologist": "crazy_archaeologist",
      "Dagannoth Prime": "dagannoth_prime",
      "Dagannoth Rex": "dagannoth_rex",
      "Dagannoth Supreme": "dagannoth_supreme",
      "Deranged Archaeologist": "deranged_archaeologist",
      "General Graardor": "general_graardor",
      "Giant Mole": "giant_mole",
      "Grotesque Guardians": "grotesque_guardians",
      "Hespori": "hespori",
      "Kalphite Queen": "kalphite_queen",
      "King Black Dragon": "king_black_dragon",
      "Kraken": "kraken",
      "Kree'Arra": "kreearra",
      "K'ril Tsutsaroth": "kril_tsutsaroth",
      "Mimic": "mimic",
      "Nex": "nex",
      "Nightmare": "nightmare",
      "Phosani's Nightmare": "phosanis_nightmare",
      "Obor": "obor",
      "Sarachnis": "sarachnis",
      "Scorpia": "scorpia",
      "Skotizo": "skotizo",
      "Tempoross": "tempoross",
      "The Gauntlet": "the_gauntlet",
      "The Corrupted Gauntlet": "the_corrupted_gauntlet",
      "Theatre of Blood": "theatre _of_blood",
      "Theatre of Blood: Hard Mode": "theatre _of_blood_hard_mode",
      "Thermonuclear Smoke Devil": "thermonuclea_smoke_devil",
      "TzKal-Zuk": "tzkal_zuk",
      "TzTok-Jad": "tztok_jad",
      "Venenatis": "venenatis",
      "Vet'ion": "vetion",
      "Vorkath": "vorkath",
      "Wintertodt": "wintertodt",
      "Zalcano": "zalcano",
      "Zulrah": "Zulrah"
  }
  
  return map[bossName]
}