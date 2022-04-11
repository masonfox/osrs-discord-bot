// TODO: handle guilds where the bot is watching being updated, such as the name

module.exports = {
  name: "guildUpdate",
  once: false,
  async execute(oldGuild, newGuild) {
    console.log("A guild was updated");
    console.log(oldGuild, newGuild);
  }
}
