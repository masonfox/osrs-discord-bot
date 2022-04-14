/**
 * The base user model
 */
module.exports = class Player {
  constructor(name, skills = {}, bosses = {}, clues = {}) {
    this.name = name;
    this.skills = skills;
    this.bosses = bosses;
    this.clues = clues;
  }
};
