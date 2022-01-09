const { fetchAllPlayers, timestamp } = require("../utilities")
const app = require("../app")
const { db } = require("../firebase")

const admins = [
    "397044534988636161"
]

module.exports = async function rebase (msg) {
    // 
    if (admins.includes(msg.author.id)) {
        const DBplayers = await fetchAllPlayers()
        // get osrs data
        const data = await app.getRSData(DBplayers)
        // update
        for (let i = 0; i < data.length; i++) {
            let player = data[i]
            // force update DB
            await db.collection("players").doc(player.name.toLowerCase()).update({
                clues: player.clues,
                bosses: player.bosses,
                skills: player.skills,
                updatedAt: timestamp()
            })
        }
        msg.channel.send("All player data rebased")
    } else {
    // denied
    channel.send("Sorry, you need to be an admin to issue this command")
    }
}