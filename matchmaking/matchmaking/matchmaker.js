const GameLauncher = require('./gameLauncher')
const { formatNumber } = require('../utils/matchmakingUtils')
const admin = require('../../config/firebase_init')
const db = admin.firestore()

class Matchmaker {
    constructor(gameModeId) {
        this.gameMode = gameModeId
        this.intervalDuration = 5000
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
        this.createGameSession(realPlayersInGame, botsInGame, this.gameMode, this.region)
    }

    createGameSession(players, bots, mode, region) {
        console.log("🎮 Game session created!")
        console.log("Game mode:", mode)
        console.log("Game region:", region)
        console.log("Players in the game:")
        players.forEach(player => console.log(player.id))
        console.log("Bots in the game:")
        bots.forEach(bot => console.log(bot.id))
    }

    stop() {
        clearInterval(this.interval)
        console.log(`🛑 Matchmaker [${this.gameMode}] arrêté`)
    }
}

const match = new Matchmaker(1)
match.start()
