module.exports = function listCommands(msg) {
  msg.channel
    .send(`You'll find all of the commands below. You can use a command by entering \`!osrs {command}\`!
      > - \`sub\` - begin watching tracked players
      > - \`unsub\` - stop watching tracked players
      > - \`list\` - lists all of the currently tracked players
      > - \`add "rsn"\` - add a player to track
      > - \`remove "rsn"\` - remove a tracked player
      > - \`recap "rsn" day/week/month\` - complies the progress history over the selected timeframe
      > - \`when\` - reads out the next update time
      > - \`status\` - provide a status dump for this channel
      > - \`donate\` - info. about donating ❤️`);
};
