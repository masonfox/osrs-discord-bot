const { MessageAttachment, MessageEmbed } = require("discord.js");
const nodeHtmlToImage = require("node-html-to-image");
const { getResource, getTime } = require("./utilities");

module.exports = async (channel, players = null) => {
  if (!players)
    throw new Error("User sections are required for image creation");

  let block = "";
  let content = {
    tada: getResource("tada"),
  };

  players.forEach((player) => {
    block += player.renderBlock;
    // flatten player content, unique
    for (const key in player.content) {
      if (!content.hasOwnProperty(key)) {
        content[key] = player.content[key];
      }
    }
  });

  const _htmlTemplate = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <style>
            body {
                font-family: "Poppins", Arial, Helvetica, sans-serif;
                background: #2F3136;
                color: #fff;
                width: 375px;
                min-height: 100%;
                padding: 10px;
                position: relative;
            }

            .app:before {
                background: url('https://www.runescape.com/img/rsp777/scroll/backdrop_765_top.gif') no-repeat;
                background-size: 390px;
                content: '';
                height: 50px;
                position: absolute;
                left: 3px;
                top: 0;
                width: 100%;
            }

            .app:after {
                background: url('https://www.runescape.com/img/rsp777/scroll/backdrop_765_bottom.gif') no-repeat;
                background-size: 390px;
                content: '';
                height: 50px;
                position: absolute;
                left: 3px;
                bottom: -20px;
                width: 100%;
            }

            .app {
                background: url(https://www.runescape.com/img/rsp777/scroll/backdrop_745.gif);
                background-size: 375px;
                padding: 15px 15px;
            }

            h1, h2, h3, h4, h5, h6, p {
                margin: 0;
                padding: 0;
            }

            .player-name {
                color: #7B4F17;
                text-shadow: 1px 1px 1px #000000;
            }

            .player-header {
                display: flex;
                align-items: center;
                flex-wrap: no-wrap;
                justify-content: space-between;
                padding-right: 5px;
            }

            .player-header .player-name {
                font-size: 1.6rem;
                margin-bottom: .65rem;
            }

            .player-header .player-levels {
                position: relative;
                top: -3px;
                font-size: 15px;
                white-space: nowrap;
            }

            .player-header .spacer {
                position: relative;
                top: -3px;
                background: #8e6d44;
                height: 2px;
                width: 100%;
                margin: 0 .55rem;
            }

            div {
                color: #000;
            }

            .user-block {
                margin: 1.5rem 0;
                width: 100%;
            }

            .block-row {
                display: grid;
                grid-gap: 10px;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                margin-bottom: 1rem;
            }

            .block-main {
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .block-item .value {
                font-size: 1.5rem;
                margin-right: 4px;
            }

            .block-item .value[level="99"] {
                color: green;
            }

            .block-item .variance {
                color: green;
                font-size: 1rem;
            }

            .block-main .skill-max {
                height: 30px;
                width: auto;
                position: relative;
                top: -1px;
            }

            .skill-icon {
                height: 30px;
                width: auto;
                margin-right: .5rem;
            }

            .bosses .skill-icon {
                margin-right: .15rem;
            }
            
            .block-item small {
                display: block;
                text-align: center;
                color: #512e06;
                font-size: 12px;
            }
            </style>
        </head>
        <body>
            <div class="app">
                ${block}
            </div>
        </body>
    </html>
    `;

  const image = await nodeHtmlToImage({
    html: _htmlTemplate,
    puppeteerArgs: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    content,
  });

  const imageTitle = `OSRS-Player-Update.png`;

  const file = new MessageAttachment(image, imageTitle);

  const embed = new MessageEmbed()
    .setColor("#7B4F17")
    .setURL("https://www.osrsbuddy.com/")
    .setAuthor({
      name: "OSRS Buddy",
      iconURL: "https://www.osrsbuddy.com/images/osrs-icon.png",
      url: "https://www.osrsbuddy.com/",
    })
    .setImage(`attachment://${imageTitle}`)
    .setTimestamp();

    // fire
    channel.send({ embeds: [embed], files: [file] });
};
