const { SlashCommandBuilder, REST, Routes } = require("discord.js")

module.exports = async bot => {
  let commands = []

  bot.commands.forEach(command => {
    let slashCommand = new SlashCommandBuilder()
      .setName(command.name)
      .setDescription(command.description)
      .setDMPermission(command.dm)
      .setDefaultMemberPermissions(command.permission === "Aucune" ? null : command.permission)

    if (command.options?.length >= 1) {
      for (let i = 0; i < command.options.length; i++) {
        const opt = command.options[i]
        const methodName = "add" + opt.type.charAt(0).toUpperCase() + opt.type.slice(1) + "Option"
        slashCommand[methodName](option => option
          .setName(opt.name)
          .setDescription(opt.description)
          .setRequired(opt.required)
        )
      }
    }

    commands.push(slashCommand.toJSON())
  })

  const rest = new REST({ version: "10" }).setToken(bot.token)

  await rest.put(
    Routes.applicationCommands(bot.user.id),
    { body: commands }
  )

  console.log("✅ Slash commands created !")
}
