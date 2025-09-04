const fs = require("fs")
const path = require("path")

module.exports = async bot => {
    const commandsPath = path.join(__dirname, "../commands")

    fs.readdirSync(commandsPath).filter(f => f.endsWith(".js")).forEach(file => {
        const command = require(path.join(commandsPath, file))

        if (!command.name || typeof command.name !== "string") {
            throw new TypeError(`The command ${file.slice(0, -3)} doesn't have a valid name!`)
        }

        bot.commands.set(command.name, command)
        // console.log(`✅ Command "${command.name}" loaded!`)
    })
}
