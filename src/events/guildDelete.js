// TODO: handle guilds where the bot is watching being deleted

module.exports = {
  name: 'guildDelete',
  once: false,
  async execute(guild) {
    console.log('A guild was deleted');
    console.log(guild);
  },
};
