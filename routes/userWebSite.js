const express = require('express')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const { loadConfig } = require('../utils/Utils')
const config = loadConfig()
const { playerHasAuthorisation, adminHasAuthorisation } = require('../utils/routesUtils')

const router = express.Router()

const admin = require('../config/firebase_init.js')
const { use } = require('react')
const db = admin.firestore()

router.get('/', async (req, res) => {

})

router.get('/home/infos', async (req, res) => {
    console.log("oubt")
    const infos = loadConfig()

    var accountCreated = "N/A"

    try {
        const snapshot = await db.collection(config.dbSettings.usersDbCollection).get()
        accountCreated = snapshot.size
    } catch (err) {
        accountCreated = "N/A"
    }

    const response = {
        accounts: accountCreated,
        duelsPlayed: infos.websiteStats.duelsPlayed,
        onlineGames: infos.websiteStats.onlineGame,
        infrastructureInfos: infos.statuts
    }

    const dbPing = await get_db_ping()
    console.log(dbPing)

    response.infrastructureInfos.services.db.other = dbPing

    res.status(200).json({message: response})
})

async function get_db_ping() {
    const start = Date.now()
    try {
        // Lecture d'un document "ping" (crée-le une fois dans Firestore)
        await db.collection('ping').doc('ping').get()
        const duration = Date.now() - start
        return `${duration}ms`
    } catch (err) {
        const duration = Date.now() - start
        return "Hors-ligne"
    }
}

module.exports = router