const { db } = require("../firebase")
const { timestamp } = require("../utilities")
var FieldValue = require("firebase-admin").firestore.FieldValue;

module.exports = async function removePlayer(msg) {
    let { channel, content } = msg
    let arr = content.split(" ")
    // ensure a name is provided
    if (arr.length !== 3) return msg.channel.send("I think you forgot a name after `remove`!")
    let name = arr[2]
    let nameLowered = name.toLowerCase()
    try {
        const guild = await db.collection("guilds").doc(channel.guild.id).get();
        if (guild.exists) {
            // remove the player from the players array on the guilds record
            await db.collection("guilds").doc(channel.guild.id).update({
                players: FieldValue.arrayRemove(nameLowered),
                updatedAt: timestamp()
            })
            msg.channel.send(`Player **${name}** has been successfully removed! Queue viking burial!`)

            // find if the player exists anywhere else
            const snapshot = await db.collection("guilds").where("players", "array-contains", nameLowered).get()
            if (snapshot.size == 0) {
                await db.collection("players").doc(nameLowered).delete()
            }
        } else {
            throw new Error("User can't be found")
        }
    } catch (error) {
        msg.channel.send(`Hm, couldn't find that user. Run the \`list\` command to see all existing users`)
    }
}