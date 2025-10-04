const admin = require('../config/firebase_init.js')
const db = admin.firestore()
const { loadConfig } = require('./Utils')
const config = loadConfig()

async function playerHasAuthorisation(userId, userToken) {
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
            console.log("✅ Session trouvée et valide")
            return true;
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

module.exports = {
  playerHasAuthorisation,
  adminHasAuthorisation
}

function isSessionExpired(expiration) {
    // session.expiration = ISO string
    const now = new Date(); // date actuelle UTC
    const expireDate = new Date(expiration);

    // Si maintenant > expiration => expirée
    return now > expireDate
}