const fs = require("fs")
const path = require("path")

module.exports = async bot => {
    const eventsPath = path.join(__dirname, "../events")

    fs.readdirSync(eventsPath)
        .filter(f => f.endsWith(".js"))
        .forEach(file => {
            const event = require(path.join(eventsPath, file))
            const eventName = file.replace(".js", "")

            if (typeof event !== "function") {
                console.error(`❌ Event "${file}" n'exporte pas une fonction valide.`)
                return
            }

            bot.on(eventName, event.bind(null, bot))
            // console.log(`✅ Event "${eventName}" chargé.`)
        })
}
