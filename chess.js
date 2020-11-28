const fetchutils = require('./fetchutils.js')
const chessutils = require('./chessutils.js')
const fs = require('fs')

fetchutils.fetch7z("https://ccrl.chessdom.com/ccrl/4040/games-by-month/2020-11.bare.[5159].pgn.7z", "temp.7z").then(result => {
	let pgn = fs.readFileSync(result[0]).toString()
	
	console.log(chessutils.splitPgn(pgn, 3))
})
