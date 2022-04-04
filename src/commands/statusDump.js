const mongo = require('../db');

module.exports = async function statusDump(channel) {
    const guild = await mongo.db.collection("guilds").findOne({ _id: channel.guild.id })
    if (guild) {
        let block = "```"
        let message = `OSRS Buddy status for **${guild.guildName}**:\n${block + "json\n"}${JSON.stringify(guild, null, 2)}\n${block}` // just dump the entire block, use pretty JSON format
        channel.send(message)
    } else {
        channel.send("I'm not configured for this server! Use the `!osrs sub` command to kick me off!")
    }
}