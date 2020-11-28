const fetchutils = require('./fetchutils.js')
const lichessUtils = require('./lichessutils.js')

class LichessBot{
	constructor(props){
		this.props = props || {}
		
		this.botName = this.props.botName || process.env.BOT_NAME
		this.token = this.props.token || process.env.TOKEN
		this.eventStreamTimeout = this.props.eventStreamTimeout || 10000
		this.logApi = this.props.logApi || false
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
	
	stream(){
		this.eventStreamer = new fetchutils.NdjsonStreamer({
			url: `https://lichess.org/api/stream/event`,
			token: process.env.TOKEN,
			timeout: this.eventStreamTimeout,
			timeoutCallback: _ => {
				console.log("event stream timed out")
				
				this.eventStreamer.close()
				
				this.eventStreamer.stream()
			},
			callback: blob => {
				if(blob.type == "challenge"){
					this.challenge(blob.challenge)
				}
			},
			endcallback: _ => {
				console.log("stream ended")
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
