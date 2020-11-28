const fetchutils = require('./fetchutils.js')

fetchutils.fetch7z("https://ccrl.chessdom.com/ccrl/4040/games-by-month/2020-11.bare.[5159].pgn.7z", "temp.7z").then(result => console.log(result))

