const { fetchPlayers } = require("../utilities")

/**
 * List all of the active players being tracked
 * @param {object} msg 
 */
module.exports = async function list(msg) {
    const players = await fetchPlayers()
    
    // determine if we are tracking players or not
    if (players?.length) {
        // players exist, list them
        let message = "Here are all of the players you're tracking:\n";

        players.forEach((player, index) => {
            message += `> - ${player.osrsName}`
            if ((players.length - 1) !== index) message += "\n"
        })

        msg.channel.send(message) // end
    } else {
        // players don't exist, provide instructions for adding them
        msg.channel.send(`Doesn't look like you're tracking any players! Add some with \`!osrs add [osrs name]\` command!`);
    }
}