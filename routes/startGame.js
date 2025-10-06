const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const { playerHasAuthorisation, adminHasAuthorisation, getPlayerDoc } = require('../utils/routesUtils')

const admin = require('../config/firebase_init.js')
const { use } = require('react')
const db = admin.firestore()
const { loadConfig } = require('../utils/Utils')
const config = loadConfig()



router.get('/', async (req, res) => {
    
})

router.post('/lunch', async (req, res) => {

    const luncherToken = req.body.luncher_token
    const user_id = req.body.id
    const ip = req.ip

    // =====================
    // A désactiver en prod, juste pour les tests
    const true_token = "abcdef"
    
    if (luncherToken !== true_token) {
        res.status(403).json({message : "Lucnher token invalid"})
    }
    // =====================

    const newToken = uuidv4()
    var locationResponseData = null

    try {
        const locationResponse = await axios.get(`http://ip-api.com/json/${ip}`)
        locationResponseData = locationResponse.data
    
    } catch (error) {
        return res.status(403).json({message: `Unable to verify your information ${error}`})
    }

    const now = new Date()

    const game_session = {
        "token": newToken,
        "connected_at": now.toISOString(),
        "location": locationResponseData,
        "last_activities": now.toISOString(),
        "ip": ip,
    }

    await db.collection('sessions').doc(user_id).set({
        game_session: game_session,
        last_game_sessions: admin.firestore.FieldValue.arrayUnion(game_session)
    }, { merge: true })

    const playerDoc = await  getPlayerDoc(user_id, "users")


    res.status(200).json({message: "Lunch successful", token: newToken, pseudo: playerDoc.pseudo})
})

module.exports = router
