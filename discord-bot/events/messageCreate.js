const { addXP, getXP, getLevel } = require('../managers/xpManagers.js')

module.exports = async (bot, message) => {
  if (message.author.bot) return; // Ignorer les bots

  const xpPerMessage = getRandomInt(5, 15)
  const cooldown = 0

  const added = addXP(message.author.id, xpPerMessage, cooldown, message)
  if (added) {
    const totalXP = getXP(message.author.id)
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);   // arrondi supérieur pour inclure min
  max = Math.floor(max);  // arrondi inférieur pour inclure max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}