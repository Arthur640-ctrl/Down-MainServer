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

router.post('/ban', async (req, res) => {
    
})

module.exports = router