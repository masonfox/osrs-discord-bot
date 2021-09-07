const { db } = require("../firebase")

module.exports = async function removePlayer(msg) {
    let { content } = msg
    let arr = content.split(" ")
    // ensure a name is provided
    if (arr.length !== 3) return msg.channel.send("I think you forgot a name after `remove`!")
    let name = arr[2]
    try {
        // see if we can find the requested user
        let userSnapshot = await db.collection('users').where('osrsName', '==', name).get()
        if (!userSnapshot.empty) {
            // remove from users collection
            userSnapshot.forEach(doc => doc.ref.delete())
            // remove from records collection
            await db.collection('records').doc(name).delete()
            msg.channel.send(`Player **${name}** has been successfully removed! Queue viking burial!`)
        } else {
            throw new Error("User can't be found")
        }
    } catch (error) {
        msg.channel.send(`Hm, couldn't find that user. Run the \`list\` command to see all existing users`)
    }
}