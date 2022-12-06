/**
 * Tests for the models folder in src
 */
const Compare = require('../src/models/compare');
const Player = require('../src/models/player');
const { fetchOSRSPlayer } = require('../src/utilities');
const { deepCopyPlayer } = require('./testingUtilities');

// ---- SETUP & TEARDOWN ---- //
let TEST_PLAYER = null;
let playerMock = null;

beforeAll(async () => {
  TEST_PLAYER = await fetchOSRSPlayer('Xofy');

  playerMock = new Player('Xofy', TEST_PLAYER.skills, TEST_PLAYER.bosses, TEST_PLAYER.clues);
});

test('create player model', () => {
  // mock made in setup
  expect(playerMock).toBeInstanceOf(Player);
  expect(playerMock.name).toBe('Xofy');
  expect(playerMock.skills).toMatchObject(TEST_PLAYER.skills);
  expect(playerMock.clues).toMatchObject(TEST_PLAYER.clues);
  expect(playerMock.bosses).toMatchObject(TEST_PLAYER.bosses);
});

test('compare model enforces instance of Player class', () => {
  expect(() => {
    new Compare(TEST_PLAYER, TEST_PLAYER);
  }).toThrow('instance of Player');
});

test('create player model - no progression', () => {
  const compare = new Compare(playerMock, TEST_PLAYER);

  expect(compare.hasProgressed).toBe(false);
});

test('create compare model - no progression', () => {
  const compare = new Compare(playerMock, playerMock);

  expect(compare.hasProgressed).toBe(false);
  expect(compare.hasUpdatedSkills).toBe(false);
  expect(compare.hasUpdatedClues).toBe(false);
  expect(compare.hasUpdatedBosses).toBe(false);
  expect(compare.results).toMatchObject({ skills: [], bosses: [], clues: [] }); // no progression
});

test('create compare model - progession', () => {
  // instantiate an identical player
  const progressedPlayer = deepCopyPlayer(playerMock); // deep clone/kill references

  // then update it to mock the OSRS API call
  progressedPlayer.clues.hard.score++;
  progressedPlayer.bosses.wintertodt.score++;
  progressedPlayer.skills.woodcutting.level++;

  const compare = new Compare(progressedPlayer, playerMock);

  expect(compare.hasProgressed).toBe(true);
  expect(compare.hasUpdatedSkills).toBe(true);
  expect(compare.hasUpdatedClues).toBe(true);
  expect(compare.hasUpdatedBosses).toBe(true);
  // expect(compare.results).toMatchObject({ skills: [], bosses: [], clues: [] }); // TODO:
});
