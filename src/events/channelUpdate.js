// TODO: handle channels where the bot is watching being updated, such as the name

module.exports = {
    name: "channelUpdate",
    once: false,
    async execute(oldChannel, newChannel) {
        console.log("A channel was updated")
        console.log(oldChannel, newChannel)
    },
  };
