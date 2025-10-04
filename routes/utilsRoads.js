const express = require('express')
const router = express.Router()

const admin = require('../config/firebase_init.js')
const { use } = require('react')
const db = admin.firestore()
const { loadConfig } = require('../utils/Utils')
const config = loadConfig()

router.get('/', async (req, res) => {

})

router.get('/ping/main', async (req, res) => {
    const newConfig = loadConfig()

    res.status(200).json({"ping": "ping", "maintenance": newConfig.states.maintenance})
})

router.get('/ping/db', async (req, res) => {
    const startTime = Date.now()

    try {
        await db.collection('ping').doc('ping').get()
        const endTime = Date.now()
        const requestDuration = endTime - startTime
        res.status(200).json({"ping": requestDuration})
    } catch (err) {
        res.status(200).json({"ping": 0})
    }
})

module.exports = router