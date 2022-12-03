# OSRS Buddy Bot
A Discord bot for tracking hiscore changes in Old School Runescape (OSRS). The bot automatically shares skill levels, clue scroll completions, and boss KCs for players you track to create a close-knit OSRS Discord Community.

Checkout [osrsbuddy.com](https://www.osrsbuddy.com/) for more information and how to use it!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/osrsbuddy)

## Developers
This information is only relevant to developers.

### Commands
You'll find all of the relevant commands for running the app below. If anything, please consult the `package.json` file. Specifically, the `scripts` object.

* `start` - Starts the app in production mode.
* `dev` - Starts in app in development mode. Specifically, it uses `nodemon` to watch local changes and refresh.

These can be used with node or yarn: `yarn start` or `npm run start`.

### Getting Started
#### Node
The bot is a Node Discord bot, so you'll want to ensure you have an environment setup for Node JS development.

You should be running Node LTS at minumum, but Discord JS often has a requirement for new node versions. Therefore, I suggest you use [Node Version Manager](https://github.com/nvm-sh/nvm) (NVM) to manage this.

#### Install Dependencies
Since this is a node project, you'll need to run `yarn` or `npm install` to install all of the packages/dependencies.

#### Envs
The following information should be helpful to understand the `.env` configuration. Please ensure that you create an actual `.env` from the example one provided in the repo.

* `CLIENT_TOKEN` - This will be the main token that authenticates your bot. After creating a bot in the [Discord Dev Portal](https://discord.com/developers/applications), navigate to the "OAuth2" page reset the "Client Secret" item for your token.
* `DISCORD_APP_ID` - You'll find this id after creating a dev Discord application through their [Discord Dev Portal](https://discord.com/developers/applications). It'll be on the "General Information" page.
* `TEST_DISCORD_GUILD_ID` - Due to the nature of slash commands, you'll need to assign a guild/server id when in development mode. You can find this by navigating to https://discord.com/channels/`guild_id`/`channel_id`.
* `DD_API_DEY` - This is the API key for DataDog.
* `MONGODB_CONNECTION_STRING` - This defaults to `mongodb://localhost:27017` for MongoDB Compass, but change as necessary.
* `PERSIST_PLAYER_UPDATES` - If set to false, player updates will not be updated in the DB. This can be helpful when testing and building new commands so you maintain immutable player state. This makes testing edge cases easily replicable.
* `BOOT_APP_CRONS` - If set to false, the app's crons, which run the hourly, weekly, and monthly comparisons, will not fire. This can be helpful if you're wanting to work on and or test specific slash commands - it reduces a lot of noise.

#### Database
This app has a built in expectation for a MongoDB connection, so I suggest that you install [MongoDB Compass](https://www.mongodb.com/products/compass) and create a local datastore.

In the end, the app will look for an `osrsbuddy` database within your Mongo connection, so instantiate that ahead of time. However, all of the other collections, such as `players`, `history`, and more, should be handled gracefully.

#### Discord
It is recommended that you build a separate Discord server to test/develop the bot against. This can be done by creating a new app in the [Discord Developer Portal](https://discord.com/developers/applications).

Follow the information above about the `.env` and ensure that you add the bot to your Discord server using the the following information to construct your OAuth URL:

`https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&permissions=2147534848&scope=bot%20applications.commands`

Once it is good, fire the bot up in your command line with `yarn dev` and follow the official [getting started documentation](https://www.osrsbuddy.com/#getstarted) to subscribe the bot to a specific channel in your test Discord server and begin to track players.

#### Deployment
This app has a procfile that is prepared to run with Heroku. However, given the nature of some of the bot's features, such as converting the HTML markup to a PNG, there are some additional Heroku plugins that you'll need to take into account. For example, in the aforementioned case, you'll need a `puppeteer` buildpack.

Here are the buildpacks I recommend:
* heroku/nodejs
* [puppeteer-heroku-buildpack](https://github.com/jontewks/puppeteer-heroku-buildpack)
* [heroku-buildpack-datadog](https://github.com/DataDog/heroku-buildpack-datadog.git)
    * If you want to use DD