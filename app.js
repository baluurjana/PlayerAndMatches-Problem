const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())

let db = null
const initializeDbAndSerever = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DBError:${error.message}`)
    process.exit(1)
  }
}

initializeDbAndSerever()

const convertPlayerQuery = dbobject => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
  }
}

const convertMatchDetails = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayerDetails = `
    SELECT
      *
    FROM
      player_details;`
  const player = await db.all(getPlayerDetails)
  response.send(player.map(eachPlayer => convertPlayerQuery(eachPlayer)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`
  const playerDetails = await db.get(getPlayerQuery)
  response.send(convertPlayerQuery(playerDetails))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayer = `
    UPDATE 
      player_details
    SET
      player_name = '${playerName}'
    WHERE   
      player_id = ${playerId};`
  const updatePlayerDetails = await db.run(updatePlayer)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetails = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id : ${matchId};`
  const matchArray = await db.get(getMatchDetails)
  response.send(matchArray.map(eachOne => convertMatchDetails(eachOne)))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN  match_details
    WHERE
      player_id = ${playerId};`
  const playerMatches = await db.all(getPlayerMatchQuery)
  response.send(playerMatches.map(eachOne => convertMatchDetails(eachOne)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayerQuery = `
    SELECT
      *
    FROM
      player_match_score NATURAL JOIN  match_details;
    WHERE
      match_id = ${matchId};`
  const matchPlayerArray = await db.all(getMatchPlayerQuery)
  response.send(matchPlayerArray.map(eachOne => convertPlayerQuery(eachOne)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) As totalSixes,
    FROM
      player_match_score NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`
  const matchPlayersArray = await db.get(getMatchPlayersQuery)
  response.send(matchPlayersArray)
})

module.exports = app
