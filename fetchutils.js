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

if(typeof module != "undefined"){
	module.exports = {
		fetchText: fetchText,
		fetchBinary: fetchBinary,
		fetch7z: fetch7z
	}
}
