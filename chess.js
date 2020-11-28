const fetchutils = require('./fetchutils.js')
const chessutils = require('./chessutils.js')
const { MongoClient } = require('./mongoclient.js')
const fs = require('fs')

/*fetchutils.fetch7z("https://ccrl.chessdom.com/ccrl/4040/games-by-month/2020-11.bare.[5159].pgn.7z").then(result => {
	let pgn = fs.readFileSync(result[0]).toString()
	
	console.log(chessutils.splitPgn(pgn, 3))
})*/

const mongoClient = new MongoClient()

/*mongoClient.connect().then(_ => {
	console.log("app started")
	
	setTimeout(_ => mongoClient.close(), 5000)
})*/

const eventStreamer = new fetchutils.NdjsonStreamer({
	url: `https://lichess.org/api/stream/event`,
	token: process.env.TOKEN,
	callback: blob => {
		console.log("blob", JSON.stringify(blob))
		
		eventStreamer.close()
		
		setTimeout(_ => eventStreamer.stream(), 5000)
	},
	endcallback: _ => {
		console.log("stream ended")
	}
})

eventStreamer.stream()

