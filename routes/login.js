const express = require('express')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const { loadConfig } = require('../utils/Utils')
const config = loadConfig()
const { playerHasAuthorisation, adminHasAuthorisation } = require('../utils/routesUtils')

const router = express.Router()

const admin = require('../config/firebase_init.js')
const db = admin.firestore()

router.post('/', async (req, res) => {

    // Get all information of the request
    const email = req.body.email
    const password = req.body.password
    const ip = req.ip

    var userSearch = null

    if (isEmail(email)) {
        userSearch = await db.collection('users').where('email', '==', email).limit(1).get()
    } else {
        userSearch = await db.collection('users').where('pseudo', '==', email).limit(1).get()
    }

    if (userSearch.empty) {
      return res.status(404).json({message: 'User not found'})
    }

    // Get user data
    const userData = userSearch.docs[0].data()
    
    // Check password of the player
    const isPasswordValid = await bcrypt.compare(password, userData.password)

    if (!isPasswordValid) {
        return res.status(403).json({message: 'Wrong password'})
    }

    // Check if the player is authorized to login
    const isBanned = userData.sanctions.banned
    const suspensionStart = userData.sanctions.start
    const suspensionDuration = userData.sanctions.duration
    const warmNumber = userData.sanctions.warmNumber

    const suspensionData = {
        sanctions: {
            start: suspensionStart,
            duration: suspensionDuration
        }
    }

    if (isBanned) {
        return res.status(403).json({message: "You're banned"})

    } else if (warmNumber >= config.sanctions.warmsMax) {
        // If the number of warm is to big, we ban the player
        await db.collection('users').doc(userData.account_id).set({
            sanctions: {
                banned: true,
                warmNumber: 0
            }
        }, { merge: true })

        return res.status(403).json({message: "You're banned"})
    }

    const suspensionInfos = isSuspended(suspensionData)
    if (suspensionInfos.suspended) {
        // Check if the player is not suspended
        const suspensionEnd = new Date(Date.now() + suspensionInfos.remaining).toISOString();
        return res.status(403).json({
            message: "You're suspended",
            remainingMs: suspensionInfos.remaining,
            endDate: suspensionEnd
        })
    }

    const newToken = uuidv4()
    var locationResponseData = null

    try {
        const locationResponse = await axios.get(`http://ip-api.com/json/${ip}`)
        locationResponseData = locationResponse.data
    
    } catch (error) {
        return res.status(403).json({message: `Unable to verify your information ${error}`})
    }

    const now = new Date()

    const nowIso = new Date().toISOString()
    
    const expirationDate = new Date(now.getTime() + 60 * 60 * 1000)
    const expirationIso = expirationDate.toISOString();

    const newSession = {
        "expiration": expirationIso,
        "ip": ip,
        "user_agent": null,
        "token": newToken,
        "connected_at": now.toISOString(),
        "location": locationResponseData
    }

    await db.collection('sessions').doc(userData.account_id).set({
        sessions: admin.firestore.FieldValue.arrayUnion(newSession)
    }, { merge: true })


    res.status(200).json({message: "Login successful", token: newToken})
})

router.post('/is_admin', async (req, res) => {
    const userEmail = req.body.email
    const userToken = req.body.token

    if (!userEmail || !userToken) {
        return res.status(400).json({message: "Email and token are required"})
    }

    const isAdmin = await adminHasAuthorisation(userEmail, userToken)

    if (isAdmin !== true) {
        return res.status(403).json({message: isAdmin})
    }

    res.status(200).json({message: "User is an admin"})
})

function isSuspended(userData) {
    const suspensionStart = userData.sanctions.start;
    const suspensionDuration = userData.sanctions.duration;

    if (!suspensionStart || !suspensionDuration) {
        return { suspended: false, remaining: 0 };
    }

    const startTime = new Date(suspensionStart).getTime();
    const endTime = startTime + suspensionDuration;
    const now = Date.now();

    if (now >= endTime) {
        return { suspended: false, remaining: 0 };
    }

    return { suspended: true, remaining: endTime - now };
}

module.exports = router

function isEmail(str) {
  // Regex basique pour email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
}
