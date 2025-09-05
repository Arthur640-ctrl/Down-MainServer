const Discord = require("discord.js")

module.exports = async (bot, interaction) => {

    if(interaction.type === Discord.InteractionType.ApplicationCommand) {
        let command = require(`../commands/${interaction.commandName}`)

        command.run(bot, interaction, interaction.options)
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "player_report_menu") {
            const choice = interaction.values[0]

            createTicketChannelPlayerReport(choice, interaction)

        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'close_ticket') {
            const modal = new Discord.ModalBuilder()
            .setCustomId('close_ticket_modal')
            .setTitle('Fermeture du ticket');

            const reasonInput = new Discord.TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel('Raison de la fermeture')
            .setStyle(Discord.TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder('Explique pourquoi tu fermes ce ticket');

            const firstActionRow = new Discord.ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'close_ticket_modal') {
                const reason = interaction.fields.getTextInputValue('close_reason');

                console.log(`Ticket fermé par ${interaction.user.tag}, raison : ${reason}`);

                await interaction.reply({ content: `Ticket fermé. Raison : ${reason}`, ephemeral: true });

                setTimeout(() => {
                interaction.channel.delete().catch(console.error);
                }, 100);

                interaction.user.send(`Ton ticket a été fermé. Raison : ${reason}`)
                .then(() => {
                    console.log("Message privé envoyé avec succès !");
                })
                .catch(err => {
                    console.error("Impossible d'envoyer un MP à cet utilisateur :", err);
                })
            }
        }

}


async function createTicketChannelPlayerReport(choice, interaction) {
    const guild = interaction.guild;

    // ID de la catégorie dans laquelle tu veux créer le salon
    const categoryId = "1390936117280247816"; // Remplace par l'ID de ta catégorie

    // Nom du salon à créer
    const channelName = `ticket-${interaction.user.username}`;

    // Création du salon
    const channel = await guild.channels.create({
        name: channelName,
        type: Discord.ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
        {
            id: guild.roles.everyone.id,
            deny: [Discord.PermissionFlagsBits.ViewChannel],
        },
        {
            id: interaction.user.id,
            allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
        },
        {
            id: interaction.client.user.id,
            allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ManageChannels],
        }
        ]
    })

    const staffRoleId = "1390940450524889189"

    const embedOpened = new Discord.EmbedBuilder()
    .setColor(0x00ff27)
    .setTitle(":tools: Ticket Ouvert")
    .setDescription(`🎟️ Salut ${interaction.user} ! Un membre du staff va te répondre rapidement.\n\nLe membre **${interaction.user}** à ouvert un ticket avec la raison : **${choice}**\n<@&${staffRoleId}> un ticket vient d'etre ouvert !`)

    const embedClose = new Discord.EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("📩 Fermer le ticket")
    .setDescription("Clique sur le bouton ci-dessous pour fermer le ticket.")

    const button = new Discord.ButtonBuilder()
    .setCustomId('close_ticket')
    .setLabel('❌ Fermer le ticket')
    .setStyle(Discord.ButtonStyle.Primary)

    const row = new Discord.ActionRowBuilder().addComponents(button)

    await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true })

    await channel.send(`${interaction.user}, <@&${staffRoleId}>`)
    await channel.send({ embeds: [embedOpened, embedClose], components: [row]})
}