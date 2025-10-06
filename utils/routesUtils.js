const admin = require('../config/firebase_init.js')
const db = admin.firestore()
const { loadConfig } = require('./Utils')
const config = loadConfig()

async function playerHasAuthorisation(userId, userToken, agent = null) {
    const userSearch = await db
        .collection(config.dbSettings.usersDbCollection)
        .where('account_id', '==', userId)
        .limit(1)
        .get()

    if (userSearch.empty) return "User not found"

    const userDoc = userSearch.docs[0].data()

    const sessionDocRef = db
        .collection(config.dbSettings.sessionsDbCollection)
        .doc(userId)

    const sessionSearch = await sessionDocRef.get();
    if (!sessionSearch.exists) return "Session not found"

    const sessionData = sessionSearch.data()
    let allSessions = sessionData.sessions || []

    const now = new Date()

    // On filtre les sessions expirées
    const validSessions = []
    for (const session of allSessions) {
        const expireDate = new Date(session.expiration)
        if (now > expireDate) {
            // Session expirée -> on la supprime
            console.log(`Suppression session expirée : ${session.token}`)
        } else {
            validSessions.push(session);
        }
    }

    // Mettre à jour Firestore avec les sessions valides
    await sessionDocRef.update({ sessions: validSessions })

    // Vérifier si le token fourni est encore valide
    for (const session of validSessions) {
        if (session.token === userToken) {
            if (agent != null || session.agent === agent) {
                return true
            } else {
                return true
            }

        }
    }

    return false
}

async function adminHasAuthorisation(userEmail, userToken) {
    const userSearch = await db.collection(config.dbSettings.usersDbCollection).where('account_id', '==', userEmail).limit(1).get()

    if (userSearch.empty) {
        return "Email not found"
    }

    const userDoc = userSearch.docs[0].data()
    const accountId = userDoc.account_id

    // If is admin
    if (userDoc.admin != true) {
        return "This user is not an admin"
    }

    const sessionSearch = await db.collection(config.dbSettings.sessionsDbCollection).doc(accountId).get()

    if (!sessionSearch.exists) {
        return "Session not found"
    }

    const sessionData = sessionSearch.data()
    const lastToken = sessionData.latest_token

    if (userToken != lastToken) {
        return "Invalid token"
    }

    return true
}

async function playerExists(playerId) {
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('account_id', '==', playerId).get()

    if (snapshot.empty) {
        return false
    }
    
    return true
}

async function getPlayerDoc(playerId, collectionName) {
    if (collectionName === "users") {
        const ref = db.collection(collectionName)
        const snapshot = await ref.where('account_id', '==', playerId).get()

        if (snapshot.empty) {
            return null
        }

        const doc = snapshot.docs[0]
        return { id: doc.id, ...doc.data() }

    } else if (collectionName === "sessions") {
        const docRef = db.collection('sessions').doc(playerId)
        const doc = await docRef.get()

        if (!doc.exists) {
            return null
        } else {
            return doc.data()
        }

    }
    
}

function isSessionExpired(expiration) {
    // session.expiration = ISO string
    const now = new Date(); // date actuelle UTC
    const expireDate = new Date(expiration);

    // Si maintenant > expiration => expirée
    return now > expireDate
}

async function playerGameHasAuthorisation(userId, userToken) {
    try {
        // Récupère le doc dont l'ID est playerId
        const docRef = db.collection('sessions').doc(userId)
        const doc = await docRef.get()

        if (!doc.exists) {
            return null
        }

        const docData = doc.data()
        const gameSession = docData.game_session

        if (userToken === gameSession.token) {
            return true
        } else {
            return false
        }

    } catch (error) {
        return null
    }
}

module.exports = {
  playerHasAuthorisation,
  adminHasAuthorisation,
  playerExists,
  getPlayerDoc,
  isSessionExpired,
  playerGameHasAuthorisation
}

