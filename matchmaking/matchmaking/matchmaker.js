const GameLauncher = require('./gameLauncher')
const { formatNumber } = require('../utils/matchmakingUtils')
const admin = require('../../config/firebase_init')
const db = admin.firestore()
const { v4: uuidv4 } = require('uuid')
const axios = require("axios")
const {getPlayerDoc} = require('../../utils/routesUtils')

const nodes_servers = {
    "EU": ["http://0.0.0.0:5600"]
}

class Matchmaker {
    constructor(gameModeId) {
        this.gameMode = gameModeId
        this.intervalDuration = 10000
        this.minRealPlayers = 1       // Minimum de joueurs réels requis
        this.maxPlayers = 3
        this.region = 'EU'

        this.collectionName = `mm-${formatNumber(gameModeId)}-${this.region}`
        this.interval = null
    }

    start() {
        console.log(`🌀 Matchmaker [${this.gameMode}] démarré...`)
        this.interval = setInterval(() => this.checkQueue(), this.intervalDuration)
    }

    async checkQueue() {
        // Récupérer les joueurs en attente (state == 1)
        const querySnapshot = await db.collection(this.collectionName)
            .where("state", "==", 1)
            .orderBy("join_at", "asc")
            .limit(this.maxPlayers)
            .get()

        const waitingPlayers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        // Vérifier qu'il y ait au moins un joueur réel
        if (waitingPlayers.length < this.minRealPlayers) {
            // console.log(`Waiting... Players in queue: ${waitingPlayers.length} (need at least ${this.minRealPlayers})`)
            return
        }
        
        var node = await this.getAvailableNode()

        if (node == null) {
            // console.log("❌ Aucun node disponible pour lancer la partie")
            return
        }

        // Create the game ID
        const gameID = uuidv4()

        // Prendre jusqu'au maximum autorisé
        const realPlayersInGame = waitingPlayers.slice(0, this.maxPlayers)

        // Ajouter des bots si nécessaire
        const botsInGame = []
        while (realPlayersInGame.length + botsInGame.length < this.maxPlayers) {
            botsInGame.push({ id: `bot_${realPlayersInGame.length + botsInGame.length + 1}` })
        }

        // Marquer les joueurs réels comme "en jeu" (state = 2)
        const batchUpdate = db.batch()
        realPlayersInGame.forEach(player => {
            const playerRef = db.collection(this.collectionName).doc(player.id)
            batchUpdate.update(playerRef, { state: 2 }, { merge: true })
        })
        await batchUpdate.commit()
        // console.log("Real players marked as in-game (state = 2)")

        // Lancer la session de jeu
        await this.createGameSession(realPlayersInGame, botsInGame, this.gameMode, this.region, node, gameID)
    }

    async getAvailableNode() {
        const nodes = nodes_servers[this.region] || []

        for (const nodeURL of nodes) {
            try {
                const res = await axios.get(`${nodeURL}/status`)
                const data = res.data

                if (data.free_slots > 0) {
                    return {url : nodeURL, nodeInfo: data}
                }
            } catch (err) {
                console.warn(`Node ${nodeURL} unreachable !`)
            } 
        }

        return null
    }

    async createGameSession(players, bots, mode, region, node, gameID) {
        var allPlayers = []
        for (const player of players) {
            const playerDoc = await getPlayerDoc(player.id, this.collectionName)

            const infos = {
                id: playerDoc.id,
                pseudo: playerDoc.pseudo,
                token: playerDoc.token
            }

            allPlayers.push(infos)
        }

        const payload = {
            id: gameID,
            mode: mode,
            players: allPlayers,
            bots: bots.length,
            node: null,                 // rempli par le node
            ip: null,
            port: null,
            status: "pending",          // pending, running, finished
            region: "EU"
        }


        await db.collection("games").doc(gameID).set(payload)

        const response = await axios.post(`${node.url}/game/start`, {
            token: '123456789',
            game_id: gameID
        })

        // console.log(response)

        const batchUpdate = db.batch()
        allPlayers.forEach(player => {
            const playerRef = db.collection(this.collectionName).doc(player.id)
            batchUpdate.update(playerRef, { state: 3, game: gameID }, { merge: true })
        })
        await batchUpdate.commit()
    }

    stop() {
        clearInterval(this.interval)
        console.log(`🛑 Matchmaker [${this.gameMode}] arrêté`)
    }
}

module.exports = Matchmaker