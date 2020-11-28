const fetch = require("node-fetch")

const streamBotGameUrl = gameId => `https://lichess.org/api/bot/game/stream/${gameId}`
const makeBotMoveUrl = (gameId, bestmove) => `https://lichess.org/api/bot/game/${gameId}/move/${bestmove}`
const acceptChallengeUrl = challengeId => `https://lichess.org/api/challenge/${challengeId}/accept`
const postChatUrl = gameId => `https://lichess.org/api/bot/game/${gameId}/chat`
const challengeUrl = username => `https://lichess.org/api/challenge/${username}`

function getOnlineBots(){
    return new Promise(resolve=>{
        fetch(`https://lichess.org/player/bots`).then(response=>response.text().then(content=>{
            resolve(content.match(/\/@\/[^"]+/g).map(m=>m.split("/")[2]))
        }))
    })
}

function postApi(props){    
    if(props.log) console.log("postApi", props)

    let headers = {}

    if(props.token) headers.Authorization = `Bearer ${props.token}`                        
    if(props.contentType) headers["Content-Type"] = props.contentType

    let request = {
        method: "POST",
        body: props.body || "",
        headers: headers
    }

    if(props.log) console.log("postApi request", request)

    fetch(props.url, request)
    .then(response=>response.text().then(content =>{
        if(props.callback) props.callback(content)
    }))
}

function gameChat(gameId, room, text, log, callback){	
    let rooms = [room]
    if(room == "all") rooms = ["player", "spectator"]
    for(currentRoom of rooms) postApi({
        url: postChatUrl(gameId), log: typeof log != "undefined" ? log : false, token: process.env.TOKEN,
        body: `room=${currentRoom}&text=${text}`,
        contentType: "application/x-www-form-urlencoded",
        callback: callback || (content => {if(log) console.log(`chat response: ${content}`)})
    })
}

function isStandard(variant){
    return ((variant == "standard") || (variant == "fromPosition") || (variant == "chess960"))
}

if(typeof module != "undefined"){
	module.exports = {
		streamBotGameUrl : streamBotGameUrl,
		makeBotMoveUrl : makeBotMoveUrl,
		acceptChallengeUrl : acceptChallengeUrl,
		postChatUrl : postChatUrl,
		challengeUrl: challengeUrl,
		streamEventsUrl : `https://lichess.org/api/stream/event`,
		postApi: postApi,
		gameChat: gameChat,
		getOnlineBots: getOnlineBots,
		isStandard: isStandard
	}
}
