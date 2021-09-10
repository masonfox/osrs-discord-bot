const { hiscores } = require("osrs-json-api");
const { db } = require("../firebase");
const { timestamp } = require("../utilities")
const app = require("../app")
var FieldValue = require("firebase-admin").firestore.FieldValue;

module.exports = async function addPlayer(msg) {
    let { channel, content, author } = msg
    let arr = content.split(" ")
    // ensure a name is provided
    if (arr.length !== 3) return msg.channel.send("I think you forgot a name after `add`!")
    let name = arr[2].toLowerCase()
    // try and get the user to validate their add
    try {
        // determine if the player exists in general
        await hiscores.getPlayer(name);
        // see if they already exist in the players table
        const player = await db.collection("players").doc(name).get()
        // if they don't exist, add them
        if (!player.exists) {
            // get RS data results and insert the player
            await insertNewPlayer(name)
        }
        // related to guild
        await db.collection("guilds").doc(channel.guild.id).update({
            players: FieldValue.arrayUnion(name),
            updatedAt: timestamp()
        })
        msg.channel.send(`🎉 **${name}** successfully added! I'll begin tracking them!`)
    } catch (error) {
        msg.channel.send(`I wasn't able to find a player named **${name}**`)
    }
}

async function insertNewPlayer(name) {
    const data = await app.getRSData([{ name }])
    await app.trackNewPlayer(data[0])
}