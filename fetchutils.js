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

if(typeof module != "undefined"){
	module.exports = {
		fetchText: fetchText
	}
}
