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

router.post('/', async (req, res) => {

})

router.post('/get/players/panel1', async (req, res) => {
    const userEmail = req.body.email
    const userToken = req.body.token

    const authResult = await adminHasAuthorisation(userEmail, userToken)
    if (authResult !== true) {
        return res.status(403).json({ message: authResult })
    }

    const snapshot = await db.collection('users').get()
    
    const usersList = []

    snapshot.forEach(doc => {
        const data = doc.data()
        const playerData = {
            email: data.email,
            id: data.account_id,
            pseudo: data.pseudo,
            created_at: data.created_at,
            state: data.state
        }
        
        usersList.push(playerData)
    })


    return res.status(200).json({ playersData: usersList })

})

router.post('/get/players/panel2', async (req, res) => {
    const userEmail = req.body.email
    const userToken = req.body.token
    const playerId = req.body.playerId

    const authResult = await adminHasAuthorisation(userEmail, userToken)
    if (authResult !== true) {
        return res.status(403).json({ message: authResult })
    }

    const userSearch = await db.collection('users').doc(playerId).get()
    if (!userSearch.exists) {
        return res.status(404).json({ message: 'Player not found' })
    }

    const userData = userSearch.data()
    const sessionSearch = await db.collection('sessions').doc(playerId).get()
    if (!sessionSearch.exists) {
        return res.status(404).json({ message: 'Session not found' })
    }

    var allSessions = sessionSearch.data().historique || []

    var response = {
        play_time: userData.stats.played_time || "N/A",
        played_games: userData.stats.played_games || "N/A",
        wl: userData.stats.wl || "N/A",
        actual_state: userData.state || "N/A",
        sessions: allSessions,
        email: userData.email || "N/A",
        pseudo: userData.pseudo || "N/A",
        created_at: userData.created_at || "N/A",
        id: userData.account_id || "N/A",
        password_hash: userData.password || "N/A",
        a2f_enabled: userData.two_factor_enabled || false,
        admin: userData.admin || false,
        avatar: userData.profile?.avatar || null,
    }

    return res.status(200).json({ playerData: response })
})

module.exports = router