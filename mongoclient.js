class MongoClient{
	constructor(props){
		this.props = props || {}
		
		this.connectURI = this.props.connectURI || process.env.MONGODB_URI
		
		this.client = null
	}
	
	connect(){
		return new Promise((resolve, reject) => {
			if(this.client){
				console.log("already connected")
				
				reject("already connected")
				
				return
			}
			
			if(!this.connectURI){
				console.log("no connect URI")
				
				reject("no connect URI")
				
				return
			}
			
			require('mongodb').MongoClient.connect(this.connectURI, {useNewUrlParser: true, useUnifiedTopology: true}, (err, setClient) => {  
				if(err){
					console.log("MongoDb connection failed.")
					
					reject("connection failed")
				}else{
					console.log("MongoDb connected.")

					this.client = setClient
					
					resolve(true)
				}
			})
		})
	}
	
	close(){
		if(this.client) this.client.close()
		
		this.client = null
	}
}

if(typeof module != "undefined"){
	module.exports = {
		MongoClient: MongoClient
	}
}
