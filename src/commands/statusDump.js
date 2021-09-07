const { db } = require("../firebase");

module.exports = async function statusDump(channel) {
    const doc = await db.collection("guilds").doc(channel.guildId).get()
    if (doc.exists) {
        let data = doc.data()
        console.log(data)
        let block = "```"
        let message = `OSRS Buddy status for ${data.guildName}:\n${block + "json\n"}${JSON.stringify(data, null, 2)}\n${block}` // just dump the entire block, use pretty JSON format
        channel.send(message)
    } else {
        channel.send("Doesn't look like I'm currently running or have run here previously. Use the `start` command to kick me off!")
    }
}