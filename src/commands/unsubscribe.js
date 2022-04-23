const { SlashCommandBuilder } = require('@discordjs/builders');
const client = require('../client');
const mongo = require('../db');

exports.data = new SlashCommandBuilder()
  .setName('unsubscribe')
  .setDescription('Prevents future progress updates from sending');

exports.execute = async (interaction, id, logger) => {
  await interaction.deferReply({ ephemeral: true });
  const record = await mongo.db
    .collection('guilds')
    .findOne({ _id: interaction.guildId });

  if (record && record?.subscribed === true) {
    await mongo.db.collection('guilds').updateOne(
      { _id: interaction.guildId },
      {
        $set: {
          subscribed: false,
          updatedAt: new Date(),
        },
      },
    );

    // send confirmation to actor
    await interaction.editReply("You've been unsubscribed!");

    logger.info('Guild unsubscribed successfully');

    // send confirmation to associated channel
    const channel = client.channels.cache.get(record.channelId);
    return channel.send(`${interaction.user.username} unsubscribed this server from OSRS Buddy Bot updates. If you change your mind, use \`/subscribe\` to get rolling again!`);
  }

  return interaction.editReply("You're not currently subscribed!");
};
