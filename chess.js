const fetchutils = require('./fetchutils.js')

fetchutils.fetchText("https://lichess.org").then(text => console.log(text))

