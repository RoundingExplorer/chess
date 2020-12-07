# Lichess Correspondence Bot

Lichess bot that can play many correspondence games at a time in any variant. Runs on Heroku as a worker process.

## Configuration

Set Heroku config vars ( or environment variables ) as follows.

### TOKEN

Lichess API token https://lichess.org/account/oauth/token/create? ( required scopes : Read incoming challenges / Create, accept, decline challenges, Play games with the bot API ).

### BOT_NAME

Lichess bot username.

### CORRESPONDENCE_THINKING_TIME

Think as if the bot was making the opening move of a game with thinking time CORRESPONDENCE_THINKING_TIME and no increment. ( The actual thinking time will be determined by the engine based on this time control. )

### REAL_TIME_LIMIT

The bot can play relatively slow real time games. Set real time limit to the minimum required initial time in seconds ( defaults to 600 seconds, or 10 + 0 game ).

## Engine

Stockfish 12 multi variant https://s3-us-west-2.amazonaws.com/variant-stockfish/ddugovic/master/stockfish-x86_64 .

## Bot on lichess

https://lichess.org/@/SuperBrainiac

## Author on lichess

https://lichess.org/@/Soumilmitra
