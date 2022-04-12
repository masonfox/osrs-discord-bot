const logger = require("../../logger");
const client = require("../client")

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    //Check if author is a bot or the message was sent in dms and return
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    //get prefix from config and prepare message so it can be read as a command
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);
    //Check for prefix
    if (!cmd.startsWith("!osrs")) return;
    //Get the command from the commands collection and then if the command is found run the command file
    let commandfile = client.commands.get(args[0]);
    logger.info(`Command file attempted through message: ${commandfile}`)
    // if (commandfile) commandfile.execute(message, args);
  },
};
