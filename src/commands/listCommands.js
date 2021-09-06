module.exports = function listCommands(msg) {
  msg.channel
    .send(`You'll find all of the commands below. You can use a command by entering \`osrs {command}\`!
      > - \`start\` - boots up the script
      > - \`stop\` - stops the script
      > - \`list\` - lists all of the currently tracked players
      > - \`add [osrs name]\` - add a player to track
      > - \`remove [osrs name]\` - remove a tracked player
      > - \`status\` - provide a status dump for this channel`);
};
