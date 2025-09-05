const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js')

const filePath = path.join(__dirname, '../xp.json')

// Lire les données JSON
function loadXP() {
  if (!fs.existsSync(filePath)) return {};
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

// Sauvegarder les données JSON
function saveXP(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// Ajouter de l'XP à un utilisateur
function addXP(userId, amount, cooldown = 60, message = null) {
  const xpData = loadXP()
  const now = Date.now()

  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, lastMessage: 0, level: 0 }
  }

  // Vérifier cooldown
  if (now - xpData[userId].lastMessage < cooldown * 1000) {
    return false // trop tôt → pas d'XP
  }

  const oldLevel = xpData[userId].level
  const oldXP = xpData[userId].xp

  // Ajouter l'XP
  xpData[userId].xp += amount
  xpData[userId].lastMessage = now

  // Calcul du nouveau niveau
  const newLevel = getLevel(xpData[userId].xp)
  xpData[userId].level = newLevel

  // Message si montée de niveau
  if (newLevel > oldLevel) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700') // couleur dorée
      .setTitle('🎉 Niveau atteint !')
      .setDescription(`<@${userId}> est passé au **niveau ${newLevel}** !\n\n Penses à recuperer tes recompenses dans le jeu !`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp()

    message.channel.send({ embeds: [embed] })
  }

  saveXP(xpData)
  return true
}

// Obtenir le total d'XP
function getXP(userId) {
  const xpData = loadXP()
  return xpData[userId] ? xpData[userId].xp : 0
}

// Obtient le niveau actuel
function getLevel(xp) {
  return Math.floor(Math.sqrt(xp / 50));
}

// Obtenir le niveau depuis le fichier
function getUserLevel(userId) {
  const xpData = loadXP();
  return xpData[userId] ? xpData[userId].level : 0;
}

module.exports = { addXP, getXP, getLevel }
