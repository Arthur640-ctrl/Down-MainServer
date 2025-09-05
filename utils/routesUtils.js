const admin = require('../config/firebase_init.js')
const db = admin.firestore()
const { loadConfig } = require('./Utils')
const config = loadConfig()

async function playerHasAuthorisation(userEmail, userToken) {

    const userSearch = await db.collection(config.dbSettings.usersDbCollection).where('email', '==', userEmail).limit(1).get()

    if (userSearch.empty) {
        return "Email not found"
    }

    const userDoc = userQuery.docs[0].data()
    const accountId = userDoc.account_id

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

async function adminHasAuthorisation(userEmail, userToken) {
    const userSearch = await db.collection(config.dbSettings.usersDbCollection).where('email', '==', userEmail).limit(1).get()

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