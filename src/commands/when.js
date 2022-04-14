module.exports = function when(channel, nextRunTime) {
  channel.send(`I will run at: ${nextRunTime}`);
};
