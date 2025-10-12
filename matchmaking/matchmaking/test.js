const Matchmaker = require('./matchmaker');

(async () => {
    const match = new Matchmaker(1)
    match.start()
})()
