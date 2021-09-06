const { hiscores } = require("osrs-json-api");
const { db } = require("../firebase");
const { timestamp } = require("../utilities")

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
        // TODO: go ahead and trigger the first insertion into the records table
        msg.channel.send(`🎉 **${name}** successfully added! I'll begin tracking them!`)
    } catch (error) {
        msg.channel.send(`I wasn't able to find a player named **${name}**`)
    }
}