const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js')
const client = require("../client")
const mongo = require('../db');

exports.data = new SlashCommandBuilder()
	.setName('subscribe')
	.setDescription('Enables receiving progress updates for tracked players');

exports.execute = async (interaction) => {
    const textChannels = client.channels.cache.filter((channel) => channel.type === "GUILD_TEXT")
    const channelOptions = textChannels.map((channel) => ({
        label: `#${channel.name}`,
        value: channel.id
    }))

    const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('channel')
					.setPlaceholder('Select a text channel')
                    .setMaxValues(1)
					.addOptions(channelOptions),
			);

	interaction.reply({ content: 'Select a text channel to have updates sent to:', components: [row], ephemeral: true });
}

exports.handler = async (interaction, id) => {
    if (id == "channel") subscribe(interaction)
}

async function subscribe (interaction) {
    const guild = interaction.member.guild;
    const selectedChannelId = interaction.values[0];
    const channel = client.channels.cache.get(selectedChannelId);
    const query = { guildId: guild.id };

    // look for any existing config and maintain
    const record = await mongo.db.collection("guilds").findOne(query);
    const players = record ? record.players : [];
    const createdAt = record ? record.createdAt : new Date();

    const data = {
        _id: guild.id,
        players,
        createdAt,
        subscribed: true,
        channelId: channel.id,
        channelName: channel.name,
        guildName: guild.name,
        guildId: guild.id,
        updatedAt: new Date(),
    };

    // upsert
    await mongo.db
        .collection("guilds")
        .updateOne(query, { $set: data }, { upsert: true });

    // adjust response if the guild is already in the db
    if (!record) {
        interaction.update({ content: `You're good to go! Use \`/track\` to add players to your watch list!`, components: [] })
        channel.send("This channel is subscribed to OSRS Buddy updates! You can add players to track with \`/track\` and see your current players with \`/players\`!")
    } else {
        interaction.update({ content: `Got it! I've updated your information!`, components: [] })
        // only if they weren't subscribed, announce it
        if (record.subscribed == false) {
            channel.send("This channel is subscribed to OSRS Buddy updates! You can add players to track with \`/track\` and see your current players with \`/players\`!")
        }
    }
}