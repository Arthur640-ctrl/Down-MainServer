const loadSlashCommands = require("../loaders/loadSlashCommands")

module.exports = async bot => {
    console.log(`🤖 Bot prêt en tant que ${bot.user.tag}`)

    await loadSlashCommands(bot)
}
