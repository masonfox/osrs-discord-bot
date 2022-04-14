const { recap } = require('../app/recap');
const htmlToPng = require('../htmlToPng');

module.exports = async function recapCommand(msg) {
  const { channel, content } = msg;
  const arr = content.split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

  /**
   * Validation Logic
   */
  // ensure a name is provided
  if (arr.length == 2) { return channel.send('I think you forgot a name after `add`!'); }

  if (arr.length == 3) { return channel.send('What timeframe did you want to search for? Options: `day`, `week`, `month`.\n\nYour command should look like this: `recap "rsn" timeframe.`'); }

  // validate double quotes
  if (!content.includes('"')) { return channel.send('Encase the name in double quotes! Example: "Zezima"'); }

  // grab the rsn between then quotes
  const name = content
    .substring(content.indexOf('"') + 1, content.lastIndexOf('"'))
    .trim();

  // lower name - this is used as the id for the players collection
  const nameLowered = name.toLowerCase();

  const timeframe = arr[3].toLowerCase();

  if (!['day', 'week', 'month'].includes(timeframe)) return channel.send("That's not a valid timeframe! Options are: `day`, `week`, `month`");

  const final = await recap([nameLowered], timeframe);

  if (final.length > 0) {
    htmlToPng(channel, `Ad-hoc **${timeframe}** recap for **${name}**!`, [], final);
  } else {
    channel.send("We don't show any history for this player in this timeframe. Either try a different timeframe or try again later!");
  }
};
