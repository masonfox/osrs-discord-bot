// const { v4: uuid } = require('uuid');
const logger = require('../../logger');
const client = require('../client');
const { rebase } = require('../admin/commands');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    // create base cmd logger
    // const childLogger = logger.child({
    //   instance: uuid(),
    //   layer: 'cmd',
    //   author: {
    //     id: msg.author.id,
    //     name: msg.author.username,
    //   },
    //   channel: {
    //     id: channel.id,
    //     name: channel.name,
    //   },
    //   guild: {
    //     id: channel.guild.id,
    //     name: channel.guild.name,
    //   },
    // });

    // Check if author is a bot or the message was sent in dms and return
    if (message.author.bot) return;
    if (message.channel.type === 'dm') return;
    // get prefix from config and prepare message so it can be read as a command
    const messageArray = message.content.split(' ');
    const cmd = messageArray[0];
    const args = messageArray.slice(1);
    // Check for prefix
    if (!cmd.startsWith('!osrs')) return;

    // execute admin commands
    if (args[0] === 'rebase') {
      rebase(message);
    }
  },
};
