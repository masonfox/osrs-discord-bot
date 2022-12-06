/**
 * Tests for the utilities JS file
 */
const fs = require('fs');
const {
  titleCase,
  fetchOSRSPlayer,
  combatLevel,
  bossMap,
  getResource,
} = require('../src/utilities');

// ---- SETUP & TEARDOWN ---- //
let TEST_PLAYER = null;

beforeAll(async () => {
  TEST_PLAYER = await fetchOSRSPlayer('Xofy');
});

// ---- UNIT TESTS ---- //
test('converts to title case', () => {
  expect(titleCase('hello world')).toMatch('Hello World');
});

test('reads all local icons', () => {
  const localFilesNames = fs.readdirSync('./src/resources/icons/');
  const results = [];

  for (const file of localFilesNames) {
    results.push(getResource(file));
  }

  expect(results.length).toBe(localFilesNames.length);
  expect(results).not.toContain('undefined.png');
});

test('produces a combat level', () => {
  const { skills } = TEST_PLAYER;
  const level = combatLevel(skills);
  expect(level).toBe(117);
});

test('maps bosses correctly', async () => {
  const { bosses } = TEST_PLAYER;
  const results = [];

  Object.keys(bosses).forEach((bossName) => results.push(bossMap(bossName)));

  expect(results.length).toBe(Object.keys(bosses).length);
  expect(results).not.toContain(undefined);
});

// ---- INTEGRATION TESTS ---- //
test('fetches an OSRS player from hiscore API', async () => {
  const player = TEST_PLAYER; // see setup
  expect(player).toHaveProperty('skills');
  expect(player).toHaveProperty('clues');
  expect(player).toHaveProperty('bosses');
});

// fetchAllPlayers

// fetchAllPlayerIds

// fetchPlayerById

// fetchGuildPlayers

// fetchGuildsWithPlayer

// fetchGuilds

// fetchGuildCount

// fetchGuildById

// validateGuild
