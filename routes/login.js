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
    const email = req.body.email
    const password = req.body.password
    const ip = req.ip

    const userSearch = await db.collection('users').where('email', '==', email).limit(1).get()

    if (userSearch.empty) {
      return res.status(404).json({message: 'User not found'})
    }

    const userData = userSearch.docs[0].data()
    const isPasswordValid = await bcrypt.compare(password, userData.password)

    if (!isPasswordValid) {
        return res.status(403).json({message: 'Wrong password'})
    }

    const newToken = uuidv4()
    var locationResponseData = null

    try {

        const locationResponse = await axios.get(`http://ip-api.com/json/${ip}`)
        locationResponseData = locationResponse.data
    
    } catch (error) {
        return res.status(403).json({message: `Unable to verify your information ${error}`})
    }

    const nowIso = new Date().toISOString()

    const newSession = {
        "ip": ip,
        "user_agent": null,
        "token": newToken,
        "connected_at": nowIso,
        "location": locationResponseData
    }

    await db.collection('sessions').doc(userData.account_id).set({
        latest_token: newToken,
        latest_login: admin.firestore.FieldValue.serverTimestamp(),
        historique: admin.firestore.FieldValue.arrayUnion(newSession)
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

module.exports = router
