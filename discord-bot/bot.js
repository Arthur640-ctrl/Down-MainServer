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

    await loadCommands(bot)
    await loadEvents(bot)

    bot.on('ready', async () => {
        console.log(`${bot.user.tag} est en ligne !`)

        // Ici le bot est prêt, on peut charger les slash commands
        await loadSlashCommands(bot)
        console.log('Slash commands chargées !')
    })

}


module.exports = {
  startBot
}
