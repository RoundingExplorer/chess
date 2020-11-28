const fetchutils = require('./fetchutils.js')
const lichessutils = require('./lichessutils.js')
const { makeUciMoves } = require('./scalachess.js')
const { UciEngine } = require('./uci.js')
const fs = require('fs')
const path = require('path')

let engine = new UciEngine(path.join(__dirname, "stockfish12m"))

class LichessBot{
	constructor(props){
		this.props = props || {}
		
		this.botName = this.props.botName || process.env.BOT_NAME
		this.token = this.props.token || process.env.TOKEN
		this.eventStreamTimeout = this.props.eventStreamTimeout || 10000
		this.logApi = this.props.logApi || false
		
		this.gameStreamers = {}
		this.thinking = false
		
		this.correspondenceThinkingTime = this.props.correspondenceThinkingTime || process.env.CORRESPONDENCE_THINKING_TIME || 60000
	}
	
	acceptChallenge(challenge){
		console.log("accepting challenge", challenge.id)
		
		lichessutils.postApi({
			url: lichessutils.acceptChallengeUrl(challenge.id), log: this.logApi, token: this.token,
			callback: content => console.log(`accept challenge response: ${content}`)
		})
	}
	
	challenge(challenge){
		this.acceptChallenge(challenge)
	}
	
	playGame(id){		
		if(this.thinking) return
		
		console.log("playing game", id)
		
		let gameFull, gameState, variant, initialFen, currentFen, moves, turn
		
		this.gameStreamers[id] = new fetchutils.NdjsonStreamer({
			url: lichessutils.streamBotGameUrl(id),
			token: process.env.TOKEN,
			timeout: this.eventStreamTimeout,
			timeoutCallback: _ => {
				console.log("game event stream timed out", id)
				
				this.gameStreamers[id].close()
				
				this.gameStreamers[id].stream()
			},
			callback: blob => {
				if(!this.gameStreamers[id].streaming){
					return
				}
				
				if(this.thinking){
					return
				}
				//console.log(blob)
				if(blob.type == "gameFull"){
					//fs.writeFileSync("stuff/gamefull.json", JSON.stringify(blob, null, 2))
					console.log("game full", id)
					
					gameFull = blob
					gameState = blob.state
					
					gameFull.botWhite = gameFull.white.name == this.botName
					gameFull.botBlack = gameFull.black.name == this.botName
					
					gameFull.hasBot = gameFull.botWhite || gameFull.botBlack
					
					if(!gameFull.hasBot){
						console.log("game full has no bot", this.botName)
						
						this.gameStreamers[id].close()
					}else{
						variant = gameFull.variant.key
						
						initialFen = gameFull.initialFen
						
						if(initialFen == "startpos") initialFen = undefined
						
						let result = makeUciMoves(variant, initialFen, [])
						
						if(result.success){
							initialFen = result.fen
							console.log("game initial fen", id, initialFen)
						}else{
							console.log("could not set up initial fen", id)
						
							this.gameStreamers[id].close()
						}
						
						if(gameFull.speed == "correspondence"){
							gameFull.timecontrol = {
								wtime: this.correspondenceThinkingTime,
								winc: 0,
								btime: this.correspondenceThinkingTime,
								binc: 0
							}
						}
					}
				}else if(blob.type == "gameState"){
					console.log("game state", id)					
					
					gameState = blob
				}
				
				if(blob.type != "chatLine"){
					moves = []
					
					currentFen = initialFen
					
					if(gameState.moves){
						moves = gameState.moves.split(" ")
						
						let result = makeUciMoves(variant, initialFen, moves)
						
						if(result.success){
							currentFen = result.fen
							
							console.log("game moves", moves)
						}else{
							console.log("could not set up state from", gameState.moves)
						}
					}
					
					console.log("game current fen", currentFen)
					
					let parts = currentFen.split(" ")
					
					let turn = parts[1]
					
					if( ((turn == "w") && gameFull.botWhite) || ((turn == "b") && gameFull.botBlack) ){
						console.log("bot turn", id)
						
						engine.setoption("UCI_Chess960", variant == "chess960" ? "true" : "false")
						
						if(lichessutils.isStandard(variant)){
							engine.setoption("UCI_Variant", "chess")
						}else{
							engine.setoption("UCI_Variant", variant == "threeCheck" ? "3check" : variant)
						}
						
						engine.position("fen " + initialFen, moves)
						
						let timecontrol = gameFull.timecontrol || {
							wtime: gameState.wtime,
							winc: gameState.winc,
							btime: gameState.btime,
							binc: gameState.binc
						}
						
						this.eventStreamer.close()
						
						this.thinking = true
						
						console.log(timecontrol)
						
						engine.gothen(timecontrol).then(result => {
							let bestmove = result.bestmove
							console.log("bestmove", id, bestmove)
							
							if(bestmove){
								this.thinking = false								
								lichessutils.postApi({
            						url: lichessutils.makeBotMoveUrl(id, bestmove), log: this.logApi, token: this.token,
            						callback: content => {
										console.log("make move response", content)										
									}									
								})					
								this.gameStreamers[id].close()										
								setTimeout(_ => this.eventStreamer.stream(), 3000)
							}
						})
					}else{
						console.log("opponent turn", id)
					}
				}
			},
			endcallback: _ => {
				console.log("game stream ended", id)
			}
		})

		this.gameStreamers[id].stream()
	}
	
	stream(){
		this.eventStreamer = new fetchutils.NdjsonStreamer({
			url: lichessutils.streamEventsUrl,
			token: process.env.TOKEN,
			timeout: this.eventStreamTimeout,
			timeoutCallback: _ => {
				console.log("event stream timed out")
				
				this.eventStreamer.close()
				
				this.eventStreamer.stream()
			},
			callback: blob => {
				//console.log(blob)
				if(blob.type == "challenge"){
					this.challenge(blob.challenge)
				}else if(blob.type == "gameStart"){
					if(this.eventStreamer.streaming){
						this.playGame(blob.game.id)	
					}
					
					//this.eventStreamer.close()
				}
			},
			endcallback: _ => {
				console.log("event stream ended")
			}
		})

		this.eventStreamer.stream()
	}
}

if(typeof module != "undefined"){
	module.exports = {
		LichessBot: LichessBot
	}
}
