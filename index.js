// Intitalise l'API
const express = require('express')
const cors = require('cors')
const app = express()

const corsOptions = {
  origin: ['http://127.0.0.1:5501', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

// Load la config via le fichier Utils.js
const { loadConfig } = require('./utils/Utils')
const config = loadConfig()

const { startBot } = require("./discord-bot/bot")

const { playerHasAuthorisation, adminHasAuthorisation } = require('D:/Autres/Code/Down/Down-MainServer/utils/routesUtils.js')

// Load du port depuis la config
const port = process.env.PORT || config.server.apiPort
const ip = config.server.host

// Middleware pour pouvoir recupérer les données JSON dans les requêtes
app.use(express.json())

// Root route
app.get('/', (req, res) => {
  res.json({message: "Welcome to the API of DOWN !"})
})

// Login route
const login = require('./routes/login')
app.use('/login', login)

// Register route
const register = require('./routes/register')
app.use('/register', register)

// DashBoard routes
const dashboard = require('./routes/dashboard')
app.use('/dashboard', dashboard)

// User Action routes
const user = require('./routes/userActions')
app.use('/user', user)

// User WebSite
const userWebSite = require('./routes/userWebSite')
app.use('/website', userWebSite)

// Utils Road
const utilsRoad = require('./routes/utilsRoads.js')
app.use('/utils', utilsRoad)

// Other
app.listen(port, () => {
  console.log(`Server is running on http://${ip}:${port}`)
})

startBot()
