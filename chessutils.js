function splitPgn(pgn, max){
	// remove leading white space
	pgn = pgn.replace(/^\s+/, "")
	
	// remove CRs
	pgn = pgn.replace(/\r/g, "")
	
	// split
	pgn = pgn.replace(/\n\n\[/g, "\n\n[[")
	
	let pgns = pgn.split("\n\n[")
	
	// remove trailing white space
	pgns = pgns.map(pgn => pgn.replace(/\s+$/, ""))
	
	if(pgns.length > max) pgns = pgns.slice(0, max)
	
	return pgns
}

if(typeof module != "undefined"){
	module.exports = {
		splitPgn: splitPgn
	}
}
