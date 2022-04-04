const { fetchGuildPlayers } = require("../utilities")
const mongo = require("../db")
const dayjs = require("dayjs")

/**
 * List all of the active players being tracked
 * @param {object} msg 
 */
module.exports = async function list(msg) {
    const { channel } = msg
    const playerIds = await fetchGuildPlayers(channel.guild.id)
    
    // determine if we are tracking players or not
    if (playerIds.length > 0) {
        const players = await mongo.db.collection("players").find({
            _id: {
                $in: [...playerIds]
            }
        }).toArray()

        // players exist, list them
        let message = "Here are all of the players you're tracking and when they were last updated:\n";

        players.forEach((player, index) => {
            message += `> - **${player.name}** - ${dayjs(player.updatedAt).format("MM/DD/YYYY")}`
            if ((players.length - 1) !== index) message += "\n"
        })

        msg.channel.send(message) // end
    } else {
        // players don't exist, provide instructions for adding them
        msg.channel.send(`Doesn't look like you're tracking any players! Add some with \`add "RSN"\` command!`);
    }
}