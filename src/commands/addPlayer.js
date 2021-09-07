const { hiscores } = require("osrs-json-api");
const { db } = require("../firebase");
const { timestamp } = require("../utilities")
const app = require("../app")

module.exports = async function addPlayer(msg) {
    let { content, author } = msg
    let arr = content.split(" ")
    // ensure a name is provided
    if (arr.length !== 3) return msg.channel.send("I think you forgot a name after `add`!")
    let name = arr[2]
    // try and get the user to validate their add
    try {
        await hiscores.getPlayer(name);
        await db.collection("users").add({
            osrsName: name,
            addedBy: author.username,
            createdAt: timestamp()
        })
        // add user to records collection so next pull is a direct comparison
        insertRecordsTable(name)
        msg.channel.send(`🎉 **${name}** successfully added! I'll begin tracking them!`)
    } catch (error) {
        msg.channel.send(`I wasn't able to find a player named **${name}**`)
    }
}

async function insertRecordsTable(name) {
    const user = [{ osrsName: name }]
    const data = await app.getRSData(user)
    await app.trackNewPlayer(data[0])
}