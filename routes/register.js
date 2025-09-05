const express = require('express')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const router = express.Router()
const admin = require('../config/firebase_init.js')
const db = admin.firestore()
const { loadConfig } = require('../utils/Utils');
const config = loadConfig();

const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const pseudo = req.body.pseudo

    const birth = req.body.dob

    if (!email || !regexEmail.test(email)) {
        res.status(403).json({message:'Email sent by the client is not an email'})
    }

    const emailUserSearch = await db.collection(config.dbSettings.usersDbCollection).where('email', '==', email).limit(1).get()

    if (!emailUserSearch.empty) {
      return res.status(403).json({message: 'Email already exist'})
    }

    const pseudoUserSearch = await db.collection(config.dbSettings.usersDbCollection).where('pseudo', '==', pseudo).limit(1).get()

    if (!pseudoUserSearch.empty) {
      return res.status(403).json({message: 'Pseudo already exist'})
    }

    
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(password, salt)

    const accountId = uuidv4()

    const registerFinal = {
      email: email,
      pseudo: pseudo,
      password: hashedPassword,
      account_id: accountId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      profile: {
        avatar: null
      },
      settings: {},
      friends: [],
      two_factor_enabled: false,
      admin: false,
      state: "offline",
      stats: {
        played_games: 0,
        wl: 0,
        played_time: 0,
      },
      dob: birth,
      sanctions: {
        banned: false,

        suspension: {
          start: null,
          duration: null
        },

        warmNumber: 0,
      }
    }

    await db.collection(config.dbSettings.usersDbCollection).doc(accountId).set(registerFinal)


    res.status(202).json({message: "Register successful"})

})

module.exports = router