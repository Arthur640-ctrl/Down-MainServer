// ping.js
module.exports = {
    name: "ping",
    description: "Show the latency",
    permission: "Aucune",
    dm: false,
    options: [],

    async run(bot, interaction, args) {
        await interaction.reply(`Ping : \`${bot.ws.ping} ms\``)
    }
}
