const { v4: uuid } = require('uuid');
const logger = require('../../logger');
const {
  titleCase,
  fetchAllPlayers,
  getResource,
  bossMap,
  fetchGuilds,
  combatLevel,
  fetchOSRSPlayer,
  getTime,
  addTimeFromNow,
  fetchGuildsWithPlayer,
  _isEmpty,
} = require('../utilities');
const Player = require('../models/player');
const Compare = require('../models/compare');
const client = require('../client');
const mongo = require('../db');
const htmlToPng = require('../htmlToPng');

/**
 * Run data
 */
const runs = {
  count: 0,
  next: getTime(),
  log() {
    // adjust count
    const { count } = this;
    this.count = count + 1;

    // adjust next
    const nextRun = addTimeFromNow(2, 'hour');
    this.next = nextRun;

    // log updates
    logger.info(`The bi-hourly cron has run ${this.count} time${this.count > 1 ? 's' : ''}`);
    logger.info(`Next bi-hourly update at: ${this.next}`);

    return this;
  },
};

/**
 * Main app function
 */
const main = async function main() {
  const startTime = performance.now();
  // instantiate child logger for occurence with instance id
  const childLogger = logger.child({ instance: uuid(), layer: 'cron' });

  // fetch users to track
  const users = await fetchAllPlayers();

  // retrieve and format data from OSRS API
  const { players, errors } = await getRSData(users);

  // if players errors from OSRS API, process and announce the name changes
  // if (errors.length > 0) announceNameChanges(errors);

  // returns consolidated player compare state for those who are eligble
  const progressedPlayers = await getDBState(players);

  if (progressedPlayers.length > 0) {
    // log player progressions
    progressedPlayers.forEach((player) => {
      childLogger.info(`Player progressed: ${player.name}`, {
        name: player.name,
        ...player.current,
        ...player.previous,
        variance: player.results,
      });
    });

    const withMessages = constructMessage(progressedPlayers);
    childLogger.info('Messages created');
    await sendMessages(withMessages);
    const endTime = performance.now();
    childLogger.info(`⏱️ App main took ${endTime - startTime} milliseconds`);
  } else {
    childLogger.info('No tracked players eligble for updates');
  }

  // stash
  runs.log();
};

/**
 * retrieve and format data based on tracked users from the OSRS API
 * @param {array} users
 * @returns array of user objects with skill data
 */
const getRSData = async function getRSData(players) {
  const process = [];
  const enrichedPlayers = [];
  const errors = [];

  async function constructPlayer(playerObj) {
    const data = await fetchOSRSPlayer(playerObj.name);
    if (!_isEmpty(data)) {
      const { skills, bosses, clues } = data;
      enrichedPlayers.push(new Player(playerObj.name, skills, bosses, clues));
    } else {
      errors.push(playerObj);
    }
  }

  // prepare process array for async processing
  for (const player of players) {
    process.push(constructPlayer(player));
  }

  // process all players
  await Promise.all(process);

  return {
    players: enrichedPlayers,
    errors,
  };
};

const getDBState = async function getDBState(currentStatePlayers) {
  // TODO: pull these asyncs out of the loops
  const filtered = [];

  for (const player of currentStatePlayers) {
    const doc = await mongo.db
      .collection('players')
      .findOne({ _id: player.name.toLowerCase() });
    if (doc) {
      const comparison = new Compare(player, doc);
      if (comparison.hasProgressed) {
        // we know one of these sub-levels is now higher, pass it along
        filtered.push(comparison);

        // update the db with the latest dataset for this user
        if (process.env.PERSIST_PLAYER_UPDATES === 'true') {
          await transitionState(comparison);
        } else {
          logger.info('❓Not persisting player updates. If unintended, please check the .env configuration.');
        }
      }
    } else {
      await trackNewPlayer(item);
    }
  }

  return filtered;
};

const trackNewPlayer = async function trackNewPlayer(item) {
  await mongo.db.collection('players').insertOne({
    _id: item.name.toLowerCase(),
    name: item.name,
    clues: item.clues,
    bosses: item.bosses,
    skills: item.skills,
    updatedAt: new Date(),
    createdAt: new Date(),
  });
};

const transitionState = async function transitionState(data) {
  const {
    current, name, results,
  } = data;
  const currentVersion = 'v2'; // current history object state

  // share the timestamp across these updates
  const time = new Date();

  /**
   * Updates skills in players document
   */
  await mongo.db.collection('players').updateOne(
    { _id: name.toLowerCase() },
    {
      $set: {
        skills: current.skills,
        clues: current.clues,
        bosses: current.bosses,
        updatedAt: time,
      },
    },
  );

  /**
   * Handle updates to history document
   */
  await mongo.db.collection('history').insertOne({
    playerId: name.toLowerCase(),
    name,
    delta: results,
    skills: current.skills,
    clues: current.clues,
    bosses: current.bosses,
    createdAt: time,
    version: currentVersion,
  });
};

const constructMessage = function constructMessage(data) {
  data.forEach((record, index) => {
    const { name, results } = record;

    // create the base container that everything will nest inside
    let block = `<div class="user-container">
      <div class="player-header">
        <h1 bigName="${(name.length > 8)}" class="player-name">${name}</h1>
        <span class="spacer"></span>
        <p class="player-levels">
          <span><b>${combatLevel(record.current.skills)}</b> combat</span>
          <span>/</span>
          <span><b>${record.current.skills.overall.level}</b> total</span>
        </p>
      </div>
    `;

    // create the base grid container
    block += "<div class='grid'>";

    // if necessary, build skill grid items
    if (record.hasUpdatedSkills) {
      // create individual items
      results.skills.forEach((result) => {
        const { skill, variance, level } = result;
        record.content[skill] = getResource(skill);
        const finalBlock = level === 99
          ? '<img src="{{tada}}" class="skill-max"></img>'
          : `<h3 class="variance">+${variance}</h3>`;
        // construct skill grid item
        block += `<div class="block-item skill">
          <div class="block-main">
            <img src="{{${skill}}}" class="skill-icon">
            <h1 level="${level}" class="value">${level}</h1>
            ${finalBlock}
          </div>
        </div>`;
      });
    }

    // if necessary, build clue grid items
    if (record.hasUpdatedClues) {
      results.clues.forEach((result) => {
        const { clueType, score, variance } = result;
        const iconName = `clue_${clueType}`;
        record.content[iconName] = getResource(iconName);
        // construct clue grid item
        block += `<div class="block-item clue">
          <div class="block-main">
            <img src="{{${iconName}}}" class="skill-icon">
            <h1 class="value">${score}</h1>
            <h3 class="variance">+${variance}</h3>
          </div>
          <small>(${titleCase(clueType)})</small>
        </div>`;
      });
    }

    // if necessary, build boss grid items
    if (record.hasUpdatedBosses) {
      results.bosses.forEach((result) => {
        const { boss, score, variance } = result;
        record.content[boss] = getResource(boss);
        // construct boss grid item
        block += `<div class="block-item boss">
          <div class="block-main">
            <img src="{{${boss}}}" class="skill-icon">
            <h1 class="value">${score}</h1>
            <h3 class="variance">+${variance}</h3>
          </div>
          <small>(${bossMap(boss)})</small>
        </div>`;
      });
    }

    // close the overall grid container (.grid) for this user and then the whole user block (.user-block)
    block += '</div></div>';

    // set everything generated above as the renderBlock for this user
    record.renderBlock = block;
  });

  return data;
};

/**
 * Announces the changes of players whose names likely changed
 * This should be used when players can no longer be found in the RS dataset, but have previous DB state
 * @param {array} players
 */
const announceNameChanges = async function announceNameChanges(players) {
  const processPlayers = [];
  const results = {};

  // prepare the guilds array through the player information
  async function prepareResults(player) {
    const guilds = await fetchGuildsWithPlayer(player._id);
    if (guilds.length > 0) {
      guilds.forEach((guild) => {
        // check if guild id already exists
        if (!(guild._id in results)) {
          // push a new guild record
          results[guild._id] = {
            guild,
            players: [player],
          };
        } else {
          // this guild already exists in the list - simply add the player
          results[guild._id].players.push(player);
        }
      });
    }
  }

  // populate array for async processing - see func above
  players.forEach((player) => {
    processPlayers.push(prepareResults(player));
  });

  // process all players async
  await Promise.all(processPlayers);

  // prepare channels
  const processChannels = [];
  const channelResults = [];

  async function getChannels(result) {
    const channel = await client.channels.fetch(result.guild.channelId);
    channelResults.push({
      ...result, // note, big change in data structure
      channel,
    });
  }

  // populate array for async processing - see func above
  Object.keys(results).forEach((key) => {
    processChannels.push(getChannels(results[key]));
  });

  // process all channels async
  await Promise.all(processChannels);

  // construct and send messages
  channelResults.forEach((result) => {
    const plural = result.players.length > 1;
    const baseMsg = `⚠️ Hmm... I believe the following player${plural ? "s'" : "'s"} name${plural ? 's' : ''} ${plural ? 'have' : 'has'} changed:\n\n`;
    const playerNames = result.players.map((player) => `- **${player.name}**\n`).join('');
    const instruction = '\nTo resolve this issue, please use the `/drop` command, select the name(s) above, and then track the user by their new name with the `/track` command.';
    const fullMessage = baseMsg + playerNames + instruction;

    // full send
    result.channel.send(fullMessage);
  });
};

const sendMessages = async function sendMessages(players) {
  const guilds = await fetchGuilds(true);

  guilds.forEach(async (guildObj) => {
    const channel = await client.channels.fetch(guildObj.channelId);

    const guildPlayers = players.filter((player) => guildObj.players.includes(player.name.toLowerCase()));

    // only generate a response for servers where players they track progressed
    if (guildPlayers.length > 0) {
      // prepare, transform, and send image to channel
      htmlToPng(channel, 'Standard bi-hourly progress update', [], guildPlayers);
    }
  });
};

module.exports = {
  runs,
  main,
  getRSData,
  trackNewPlayer,
  transitionState,
  announceNameChanges,
  constructMessage,
};
