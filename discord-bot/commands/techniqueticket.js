const Discord = require("discord.js")

module.exports = {
    name: "techniqueticket",
    description: "Envoie l'embed de création de Ticket pour le signalement de joueur",
    permission: Discord.PermissionFlagsBits.Administrator,
    dm: false,
    options: [],

    async run(bot, interaction, args) {

        // === Embed ===
        let Embed = new Discord.EmbedBuilder()
        .setColor(0x6E2650)
        .setTitle('**🚨 Vous avez un problème avec un joueur ?**')
        .setDescription("**Triche**, **spam**, **harcèlement**, **comportement toxique** ou **exploit** ? Créez un **ticket** en cliquant sur le bouton ci-dessous, puis **choisissez une raison** dans le menu déroulant pour que notre équipe puisse analyser le cas et agir si nécessaire.\n\nCe channel est réservé aux **signalements sérieux**. Tout **abus** ou **signalement hors sujet** pourra être **supprimé**.\n\nUne fois votre ticket **créé**, merci **d’inclure** : \n```👤 Pseudo du joueur\n🕒 Date & heure de l'incident\n📍 Mode de jeu / Map\n📸 Preuve (screenshot, vidéo, replay, log...)\n📋 Description de l’incident```\n\n**🚨 Sans preuve claire, il est très difficile d’agir. Veuillez être aussi précis que possible.**\n\n*Note : les signalements sont traités de manière confidentielle. Il se peut que vous ne receviez pas de réponse directe, mais chaque ticket est lu et évalué.*\n\n🧠 **Merci** de votre aide pour garder la **communauté saine**.")
        .setFooter({ text: "L'équipe de Down - 2025 - Tous Droits Réservés"})

        // === Menu déroulant ===
        const menu = new Discord.StringSelectMenuBuilder()
            .setCustomId("player_report_menu")
            .setPlaceholder("📋 Choisis une catégorie de signalement")
            .addOptions([
                {
                    label: "⚠️ Triche (cheat)",
                    description: "Aimbot, wallhack, speedhack, etc.",
                    value: "cheat"
                },
                {
                    label: "🐞 Abus de bug (exploit)",
                    description: "Utilisation volontaire d’un bug pour obtenir un avantage.",
                    value: "exploit"
                },
                {
                    label: "💬 Toxicité / Insultes",
                    description: "Comportement irrespectueux, harcèlement, propos déplacés.",
                    value: "toxicity"
                },
                {
                    label: "🤖 Bot / spam",
                    description: "Publicité, comptes suspects, spam...",
                    value: "spam"
                },
                {
                    label: "❓ Autre problème",
                    description: "Ce qui ne rentre pas dans les autres catégories.",
                    value: "other"
                }
            ])

        // === Ligne d'action (obligatoire pour afficher un menu) ===
        const row = new Discord.ActionRowBuilder().addComponents(menu);

        // === Répondre avec embed + menu ===
        await interaction.reply({
            embeds: [Embed],
            components: [row]
        })
    }
}

