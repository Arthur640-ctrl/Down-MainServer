const { loadConfig } = require('./utils/Utils');
const config = loadConfig();

async function matchmaking_process() {
  while (true) {
    console.log("Je tourne en boucle")
    await new Promise(resolve => setTimeout(resolve, config.matchmaking.checkIntervalMs))
  }
}

