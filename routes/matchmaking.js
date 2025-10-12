const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const { playerHasAuthorisation, adminHasAuthorisation, getPlayerDoc, playerGameHasAuthorisation } = require('../utils/routesUtils')

const admin = require('../config/firebase_init.js')
const { use } = require('react')
const db = admin.firestore()
const { loadConfig } = require('../utils/Utils')
const config = loadConfig()

const matchmaking = require('../matchmaking/matchmaking/queueManager.js')

router.get('/', async (req, res) => {
    res.status(200).json({message: "Welcome to the matchmaking"})
})

router.post('/add', async (req, res) =>  {
    const playerId = req.body.playerId
    const token = req.body.token
    const gameMode = req.body.mode

    if (! await playerGameHasAuthorisation(playerId, token)) {
        res.status(403).json({message: "Forbidden, you haven't authorization"})
        return
    }

    const result = await matchmaking.addPlayerToMode(playerId, 'EU', gameMode)
    if (result != true) {
        res.status(403).json({message: result})
        return
    }

    res.status(200).json({message: "Player added to the queue"})
})

router.post('/quit', async (req, res) =>  {
    const playerId = req.body.playerId
    const token = req.body.token
    const gameMode = req.body.mode

    if (! await playerGameHasAuthorisation(playerId, token)) {
        res.status(403).json({message: "Forbidden, you haven't authorization"})
        return
    }

    const result = await matchmaking.removePlayerFromMode(playerId, 'EU', gameMode)
    if (result != true) {
        res.status(403).json({message: result})
        return
    }

    res.status(200).json({message: "Player removed to the queue"})
})

router.post('/get', async (req, res) =>  {
    const playerId = req.body.playerId
    const token = req.body.token
    const gameMode = req.body.mode

    if (! await playerGameHasAuthorisation(playerId, token)) {
        res.status(403).json({message: "Forbidden, you haven't authorization"})
        return
    }

    const result = await matchmaking.getPlayerState(playerId, 'EU', gameMode)

    res.status(200).json(result)
})


module.exports = router
