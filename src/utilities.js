const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone'); // dependent on utc plugin
const { Hiscores } = require('oldschooljs');
const mongo = require('./db');
const logger = require('../logger');

// Dayjs library extensions
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * Returns the input string as title case
 * @param {string} str
 */
exports.titleCase = function titleCase(str) {
  str = str.toLowerCase();
  str = str.split(' ');
  for (let i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(' ');
};

exports.fetchOSRSPlayer = async function fetchOSRSPlayer(name) {
  try {
    // get raw response from API for user
    const response = await Hiscores.fetch(name);

    // prepare and patch rifts into bossess
    const { riftsClosed } = response.minigames;
    response.bossRecords.riftsClosed = riftsClosed;

    // return finalized objects
    return {
      skills: response.skills,
      clues: response.clues,
      bosses: response.bossRecords,
    };
  } catch (error) {
    logger.error(`Error fetching ${name} from OSRS Hiscores API`, {
      name,
      error,
    });
    return {};
  }
};

/**
 * Retrieve all the players from the DB
 * @returns {array} of players
 */
exports.fetchAllPlayers = async function fetchPlayers() {
  return await mongo.db.collection('players').find().toArray();
};

/**
 * Retrieve all of the player ID's from the DB
 * @returns {array} of players
 */
exports.fetchAllPlayerIds = async function fetchAllPlayerIds() {
  const players = await mongo.db.collection('players').find().toArray();
  return players.map((player) => player._id);
};

/**
 * Fetch a single player by their id
 * @param {string} id
 * @returns a player db object
 */
exports.fetchPlayerById = async (id) => await mongo.db.collection('players').findOne({ _id: id });

/**
 * Retrieve the the players from the DB for a specific guild
 * @returns {array} of players
 */
exports.fetchGuildPlayers = async function fetchGuildPlayers(guildId) {
  const guild = await mongo.db.collection('guilds').findOne({ _id: guildId });
  return (guild) ? guild.players : [];
};

/**
 * Retrieves all of the guilds that a player is tracked on
 * Note, this automatically implies that the server is subscribed
 * @param {string} playerId - the lowered username of the player
 */
exports.fetchGuildsWithPlayer = async function fetchGuildsWithPlayer(playerId) {
  return mongo.db.collection('guilds').find({ subscribed: true, players: playerId }).toArray();
};

/**
 * Retrieve all of the guilds stored in the DB
 * @returns {array} of guilds docs
 */
exports.fetchGuilds = async function fetchGuilds(subscribed = false) {
  if (subscribed) {
    return await mongo.db.collection('guilds').find({ subscribed: true }).toArray();
  }
  return await mongo.db.collection('guilds').find().toArray();
};

/**
 * Retrieve all of the guilds stored in the DB
 * @returns {array} of guilds docs
 */
exports.fetchGuildCount = async function fetchGuildCount(subscribed = false) {
  if (subscribed) {
    return await mongo.db.collection('guilds').count({ subscribed: true });
  }
  return await mongo.db.collection('guilds').count();
};

/**
 * Retrieve a guild record by its id
 * @param {string} guildId
 * @returns guild object
 */
exports.fetchGuildById = async (guildId) => await mongo.db.collection('guilds').findOne({ _id: guildId });

/**
 * Returns a dataUri/base64 of the file int he resource directory
 * @param {string} resourceName
 */
exports.getResource = function getResource(resourceName) {
  // grab resource, but handle fallback
  const image = ((name) => {
    try {
      const iconPath = `${path.join(__dirname, '/resources/icons/') + name}.png`;
      return fs.readFileSync(iconPath);
    } catch (error) {
      const fallbackPath = `${path.join(__dirname, '/resources/icons/', 'undefined.png')}`;
      return fs.readFileSync(fallbackPath);
    }
  })(resourceName); // auto-execute
  const base64 = new Buffer.from(image).toString('base64');
  return `data:image/png;base64,${base64}`;
};

/**
 * Calculates the combat level of a player
 * @param {object} skills
 * @returns combat level, number
 */
exports.combatLevel = function combatLevel(skills) {
  const base = 0.25 * (skills.defence.level + skills.hitpoints.level + (skills.prayer.level * 0.5));
  const melee = 0.325 * (skills.attack.level + skills.strength.level);
  const ranged = 0.325 * (skills.ranged.level * 1.5);
  const magic = 0.325 * (skills.magic.level * 1.5);
  const max = Math.max(melee, ranged, magic);
  const final = Math.floor(base + max);
  return (isNaN(final)) ? 'Error' : final;
};

exports.validateGuild = async function validateGuild(active = false, channel) {
  const resp = "Hm, this server isn't subscribed yet! Use `!osrs sub` to get started or re-activate!";
  const guild = await mongo.db
    .collection('guilds')
    .findOne({ _id: channel.guild.id });

  if (active) {
    if (guild && guild?.subscribed == true) {
      return true;
    }
    channel.send(resp);
    return false;
  }
  if (guild) {
    return true;
  }
  channel.send(resp);
  return false;
};

exports.bossMap = function bossMap(bossName) {
  const map = {
    abyssalSire: 'Abyssal Sire',
    alchemicalHydra: 'Alchemical Hydra',
    barrowsChests: 'Barrows Chests',
    bryophyta: 'Bryophyta',
    callisto: 'Callisto',
    cerberus: 'Cerberus',
    chambersofXeric: 'Chambers of Xeric',
    chambersofXericChallengeMode: 'Chambers of Xeric: Challenge Mode',
    chaosElemental: 'Chaos Elemental',
    chaosFanatic: 'Chaos Fanatic',
    commanderZilyana: 'Commander Zilyana',
    corporealBeast: 'Corporeal Beast',
    crazyArchaeologist: 'Crazy Archaeologist',
    dagannothPrime: 'Dagannoth Prime',
    dagannothRex: 'Dagannoth Rex',
    dagannothSupreme: 'Dagannoth Supreme',
    derangedArchaeologist: 'Deranged Archaeologist',
    generalGraardor: 'General Graardor',
    giantMole: 'Giant Mole',
    grotesqueGuardians: 'Grotesque Guardians',
    hespori: 'Hespori',
    kalphiteQueen: 'Kalphite Queen',
    kingBlackDragon: 'King Black Dragon',
    kraken: 'Kraken',
    kreeArra: "Kree'Arra",
    krilTsutsaroth: "K'ril Tsutsaroth",
    mimic: 'Mimic',
    nex: 'Nex',
    nightmare: 'Nightmare',
    phosanisNightmare: "Phosani's Nightmare",
    obor: 'Obor',
    sarachnis: 'Sarachnis',
    scorpia: 'Scorpia',
    skotizo: 'Skotizo',
    tempoross: 'Tempoross',
    theGauntlet: 'The Gauntlet',
    theCorruptedGauntlet: 'The Corrupted Gauntlet',
    theatreofBlood: 'Theatre of Blood',
    theatreofBloodHard: 'Theatre of Blood: Hard Mode',
    thermonuclearSmokeDevil: 'Thermonuclear Smoke Devil',
    tombsofAmascut: 'Tombs of Amascut',
    tombsofAmascutExpert: 'Tombs of Amascut Expert Mode',
    tzKalZuk: 'TzKal-Zuk',
    tzTokJad: 'TzTok-Jad',
    venenatis: 'Venenatis',
    vetion: "Vet'ion",
    vorkath: 'Vorkath',
    wintertodt: 'Wintertodt',
    zalcano: 'Zalcano',
    zulrah: 'Zulrah',
    riftsClosed: 'Guardians of the Rift',
  };

  return map[bossName];
};

exports.getTime = function getTime(format = 'hh:mm a (z)') {
  return dayjs.utc().tz('America/New_York').format(format);
};

exports.addTimeFromNow = function addTimeFromNow(value, length, format = 'hh:mm a (z)') {
  return dayjs.utc().add(value, length).tz('America/New_York').format(format);
};

exports._isEmpty = function _isEmpty(obj) {
  return Object.keys(obj).length === 0;
};
