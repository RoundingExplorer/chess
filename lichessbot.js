const fetchutils = require('./fetchutils.js')
const lichessutils = require('./lichessutils.js')
const fs = require('fs')

class LichessBot{
	constructor(props){
		this.props = props || {}
		
		this.botName = this.props.botName || process.env.BOT_NAME
		this.token = this.props.token || process.env.TOKEN
		this.eventStreamTimeout = this.props.eventStreamTimeout || 10000
		this.logApi = this.props.logApi || false
		
		this.gameStreamers = {}
	}
	
	acceptChallenge(challenge){
		console.log("accepting challenge", challenge.id)
		
		lichessUtils.postApi({
			url: lichessUtils.acceptChallengeUrl(challenge.id), log: this.logApi, token: this.token,
			callback: content => console.log(`accept challenge response: ${content}`)
		})
	}
	
	challenge(challenge){
		this.acceptChallenge(challenge)
	}
	
	playGame(id){
		console.log("playing game", id)
		
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
				//console.log(blob)
				if(blob.type == "gameFull"){
					//fs.writeFileSync("stuff/gamefull.json", JSON.stringify(blob, null, 2))
					console.log("game full", id)
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
					this.eventStreamer.close()
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
