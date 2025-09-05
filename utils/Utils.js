const fs = require('fs')
const yaml = require('yaml')
const path = require('path')

function loadConfig() {
    const filePath = path.resolve(__dirname, '../config/config.yaml')
    const file = fs.readFileSync(filePath, 'utf8')
    const config = yaml.parse(file)
    return config
}

module.exports = {
  loadConfig
}