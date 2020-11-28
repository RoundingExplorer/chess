if(typeof fetch == "undefined"){
	fetch = require('node-fetch')
}

function fetchText(url, params){
	return new Promise((resolve, reject) => 
		fetch(url, params || {}).then(response => response.text().then(
		content => resolve(content),
		err => reject(err)
	)))
}

function fetchBinary(url, path, params){
	return new Promise((resolve, reject) => 
		fetch(url, params || {}).then(response => {
			const dest = require('fs').createWriteStream(path)
        	response.body.pipe(dest)
        	response.body.on('end', _ => resolve(path))
		},
		err => reject(err)
	))
}

function fetch7z(url, params){
	let temp = "temp.7z"
	
	return new Promise((resolve, reject) => {
		fetchBinary(url, temp, params).then(result => {
			console.log(result)
			
			const Seven = require('node-7z')

			const myStream = Seven.extractFull(temp, 'unzip', { 
				$progress: true
			})

			let extracted = []

			myStream.on('data', function (data) {
				if(data.status == "extracted"){
					let file = "unzip/" + data.file

					console.log(`extracted ${file}`)

					extracted.push(file)
				}
			})

			myStream.on('end', function () {					
				resolve(extracted)
			})
		})
	})
}

class NdjsonStreamer{
	constructor(props){		
		this.props = props || {}
		
		this.token = this.props.token
		
		this.streaming = false
	}
	
	close(){
		if(!this.streaming){
			return
		}		
		
		this.streaming = false
		
		if(this.readable){
			this.readable.destroy()
			
			this.readable = null
			
			console.log("stream closed", this.props.url)
		}
	}
	
	stream(){
		this.streaming = true
		
		this.readable = null
		
		let headers = {
			Accept: "application/x-ndjson"
		}

		if(this.token) headers.Authorization = `Bearer ${this.token}`

		let lastTick = new Date().getTime()

		if(this.props.timeout){        
			let checkInterval = setInterval(_=>{
				if((new Date().getTime() - lastTick) > this.props.timeout * 1000){
					clearInterval(checkInterval)

					if(this.props.timeoutCallback) this.props.timeoutCallback()
				}
			}, this.props.timeout / 3)
		}

		let buffer = ""

		console.log("streamNdjson", this.props)

		fetch(this.props.url, {
			headers: headers
		})
		.then(response => {
			console.log("stream started", this.props.url)
			
			this.readable = response.body
			
			this.readable.on('end', _ => {
				if(this.props.endcallback) this.props.endcallback()
			})

			this.readable.on('data', chunk => {                      
				lastTick = new Date().getTime()

				buffer += chunk.toString()

				if(buffer.match(/\n/)){
					let parts = buffer.split(/\n/)

					buffer = parts.pop()

					for(let part of parts){
						try{
							let blob = JSON.parse(part)

							if(this.props.log) console.log(this.props.blob)

							if(this.props.callback){
								try{
									this.props.callback(blob)	
								}catch(err){
									console.log("stream callback error", err)
								}								
							}
						}catch(err){}
					}
				}
			})
		})
	}
}

if(typeof module != "undefined"){
	module.exports = {
		fetchText: fetchText,
		fetchBinary: fetchBinary,
		fetch7z: fetch7z,
		NdjsonStreamer: NdjsonStreamer
	}
}
