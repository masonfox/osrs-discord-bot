// TODO: handle channels where the bot is watching being deleted

module.exports = {
  name: 'channelDelete',
  once: false,
  async execute(channel) {
    console.log('A channel was deleted');
    console.log(channel);
  },
};
