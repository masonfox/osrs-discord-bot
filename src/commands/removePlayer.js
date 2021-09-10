const { db } = require("../firebase")
const { timestamp } = require("../utilities")
var FieldValue = require("firebase-admin").firestore.FieldValue;

module.exports = async function removePlayer(msg) {
    let { channel, content } = msg
    let arr = content.split(" ")
    // ensure a name is provided
    if (arr.length !== 3) return msg.channel.send("I think you forgot a name after `remove`!")
    let name = arr[2].toLowerCase()
    try {
        const guild = await db.collection("guilds").doc(channel.guild.id).get();
        if (guild.exists) {
            // remove the player from the players array on the guilds record
            await db.collection("guilds").doc(channel.guild.id).update({
                players: FieldValue.arrayRemove(name),
                updatedAt: timestamp()
            })
            msg.channel.send(`Player **${name}** has been successfully removed! Queue viking burial!`)

            // find if the player exists anywhere else
            const snapshot = await db.collection("guilds").where("players", "array-contains", name).get()
            if (snapshot.size == 0) {
                await db.collection("players").doc(name).delete()
            }
        } else {
            throw new Error("User can't be found")
        }
        /*
        // see if we can find the requested user
        let userSnapshot = await db.collection('users').where('osrsName', '==', name).get()
        if (!userSnapshot.empty) {
            // remove from users collection
            userSnapshot.forEach(doc => doc.ref.delete())
            // remove from records collection
            await db.collection('records').doc(name).delete()
            msg.channel.send(`Player **${name}** has been successfully removed! Queue viking burial!`)
        } else {
            
        }
        */
    } catch (error) {
        msg.channel.send(`Hm, couldn't find that user. Run the \`list\` command to see all existing users`)
    }
}