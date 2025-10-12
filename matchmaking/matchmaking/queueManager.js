const admin = require('../../config/firebase_init')
const db = admin.firestore()
const { formatNumber, isPlayerInQueue } = require('../utils/matchmakingUtils')
const { playerExists } = require('../../utils/routesUtils')

async function addPlayerToMode(playerId, region, gameMode) {
    if (!(await playerExists(playerId))) return "Player doesn't exist"
    if (await isPlayerInQueue(playerId, region, gameMode)) 
        return "Player already in the queue!"

    const now = new Date()
    
    const playerDoc = await getPlayerDoc(player.id, "users")
    const sessionDoc = await getPlayerDoc(player.id, "sessions")

    const matchmakingInfos = {
        
        id: playerId,
        join_at: now.toISOString(),
        state: 1,
        game: null,
        token: sessionDoc.game_session.token,
        pseudo: playerDoc.pseudo,
        id: playerDoc.account_id
    }

    const collectionName = `mm-${formatNumber(gameMode)}-${region}`
    await db.collection(collectionName).doc(playerId).set(matchmakingInfos)

    return true
}

async function removePlayerFromMode(playerId, region, gameMode) {
    if (!(await isPlayerInQueue(playerId, region, gameMode))) 
        return "Player Not in Queue"

    const collectionName = `mm-${formatNumber(gameMode)}-${region}`

    try {
        await db.collection(collectionName).doc(playerId).delete()
        return true
    } catch (error) {
        console.error(`Erreur lors du retrait du joueur ${playerId}:`, error)
        return "Erreur"
    }
}

async function getPlayerState(playerId, region, gameMode) {
    if (!(await playerExists(playerId))) return "Player doesn't exist"
    if (!(await isPlayerInQueue(playerId, region, gameMode))) 
        return "Player Not in Queue"

    const collectionName = `mm-${formatNumber(gameMode)}-${region}`

    
    const playerDoc = await db.collection(collectionName).doc(playerId).get()
    const playerData = playerDoc.data()

    if (playerData.state != 3) {
        return {message: "Processing...", state: playerData.state}
    } else if (playerData.state == 3) {
        const gameDoc = await db.collection("games").doc(playerData.game).get()
        const gameData = gameDoc.data()

        const playerRef = db.collection(collectionName).doc(playerId)
        await playerRef.delete()

        return {message: "Can connect !", ip: gameData.ip, port: gameData.port}
    }
}

module.exports = {
    addPlayerToMode,
    removePlayerFromMode,
    getPlayerState
}

// | État | Nom (exemple) | Description                                 | Texte affiché au joueur                          |
// | ---- | ------------- | ------------------------------------------- | ------------------------------------------------ |
// | 1    | `SEARCHING`   | Le joueur est dans la file d’attente.       | « Recherche d’une partie en cours… »             |
// | 2    | `MATCH_FOUND` | Une partie a été trouvée.                   | « Partie trouvée ! Preparation… »                |
// | 3    | `CAN_CONNECT` | Le joueur peu se connecter                  | « Connexion... »                                 |
// | 4    | `ERROR`       | Une erreur s’est produite (timeout, etc.).  | « Erreur : impossible de rejoindre une partie. » |
