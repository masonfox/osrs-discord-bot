const Player = require('../src/models/player');

exports.deepCopy = function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
};

exports.deepCopyPlayer = function deepCopyPlayer(obj) {
  const rawPlayer = JSON.parse(JSON.stringify(obj));
  return new Player(rawPlayer.name, rawPlayer.skills, rawPlayer.bosses, rawPlayer.clues);
};
