const admin = require('../../config/firebase_init')
const db = admin.firestore()

function formatNumber(num) {
  return String(num).padStart(3, '0');
}

async function isPlayerInQueue(playerId, region, gameMode) {
    const collectionName = `mm-${formatNumber(gameMode)}-${region}`
    const docRef = db.collection(collectionName).doc(playerId)
    const docSnap = await docRef.get()

    return docSnap.exists  // true si le joueur est déjà dans la queue
}

module.exports = {
  formatNumber,
  isPlayerInQueue
}
