const Discord = require('discord.js')
const intents = new Discord.IntentsBitField(3276799)
const bot = new Discord.Client({intents})

const loadCommands = require("./loaders/loadCommands")
const loadEvents = require("./loaders/loadEvents")
const loadSlashCommands = require("./loaders/loadSlashCommands")

const { loadConfig } = require('../utils/Utils')
const config = loadConfig()

bot.token = config.bot.token

async function startBot() {
    bot.commands = new Discord.Collection()

    await bot.login(bot.token) // attend la connexion complète
    await loadEvents(bot)
    await loadCommands(bot)  
}


module.exports = {
  startBot
}
