const { fetchGuildPlayers } = require("../utilities")
const { db } = require("../firebase")
var FieldPath = require("firebase-admin").firestore.FieldPath;

/**
 * List all of the active players being tracked
 * @param {object} msg 
 */
module.exports = async function list(msg) {
    const { channel } = msg
    const playerIds = await fetchGuildPlayers(channel.guild.id)
    
    // determine if we are tracking players or not
    if (playerIds.length > 0) {
        const snapshot = await db.collection("players").where(FieldPath.documentId(), "in", playerIds).get()
        const players = snapshot.docs.map((doc) => doc.data())

        // players exist, list them
        let message = "Here are all of the players you're tracking:\n";

        players.forEach((player, index) => {
            message += `> - ${player.name}`
            if ((players.length - 1) !== index) message += "\n"
        })

        msg.channel.send(message) // end
    } else {
        // players don't exist, provide instructions for adding them
        msg.channel.send(`Doesn't look like you're tracking any players! Add some with \`add [osrs name]\` command!`);
    }
}