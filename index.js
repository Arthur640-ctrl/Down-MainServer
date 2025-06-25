// Intitalise l'API
const express = require('express')
const app = express()

// Load la config via le fichier Utils.js
const { loadConfig } = require('./utils/Utils');
const config = loadConfig();


// Load du port depuis la config
const port = process.env.PORT || config.server.apiPort

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

// Other
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})