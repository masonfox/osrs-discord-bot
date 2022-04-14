const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchGuildPlayers, fetchGuildById } = require("../utilities")
const mongo = require("../db")
const dayjs = require("dayjs")

// dayjs config for relative time
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

exports.data = new SlashCommandBuilder()
	.setName('players')
	.setDescription("Lists the players you're tracking")
    .addBooleanOption(option =>
		option.setName('private')
			.setDescription('if true, only you can see the results')
			.setRequired(true));

exports.execute = async (interaction) => {
    const private = interaction.options.getBoolean('private');
    await interaction.deferReply({ ephemeral: private });

    // get the guild for validation
    const guild = await fetchGuildById(interaction.guildId)

    // confirm the guild exists
    if (!guild) return interaction.editReply({ content: "Hm, this server isn't subscribed yet! Use \`/subscribe\` to get started or re-activate!", ephemeral: private })

    // grab the guild's tracked players
    const playerIds = await fetchGuildPlayers(interaction.guildId)
    
    // determine if we are tracking players or not
    if (playerIds.length > 0) {
        const players = await mongo.db.collection("players").find({
            _id: {
                $in: [...playerIds]
            }
        }).toArray()

        // players exist, list them
        let message = "Here are all of the players you're tracking and when they were last updated:\n";

        // prepare the message
        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            message += `> - **${player.name}** - ${dayjs(player.updatedAt).fromNow()}`
            if ((players.length - 1) !== index) message += "\n"
        }

        return await interaction.editReply({ content: message, ephemeral: private });
    } else {
        // players don't exist, provide instructions for adding them
        return interaction.editReply({ content: `Doesn't look like you're tracking any players! Add some with the \`/track\` command!`, ephemeral: private });
    }
}