const createLobbyInfo = require('./createLobbyInfo')

module.exports = (eventObj, queue) => {
  const { waitingQueue, playerIdsIndexed, currentKing, challenger } = queue
  const channel = eventObj.channel
  const playerId = eventObj.author.id
  const username = eventObj.author.username
  const dmPlayer = async (msg) => await eventObj.author.send(msg)

  // Check to see if the player is already in the queue
  const isInQueue = playerIdsIndexed[playerId]
  
  // Check if player is current king or challenger
  const isKing = currentKing && currentKing.id === playerId
  const isChallenger = challenger && challenger.id === playerId
  
  // The player is already in the queue
  if (isInQueue) {
    if (isKing) {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}>, you are the current King!`
        }
      })
    } else if (isChallenger) {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}>, you are the current Challenger!`
        }
      })
    } else {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}>, you are already in the waiting queue.`
        }
      })
    }
  }

  // Create player object
  const playerObj = { id: playerId, username, dmPlayer }
  
  // Add player to the appropriate place
  playerIdsIndexed[playerId] = true
  
  // If there's no king, this player becomes king
  if (!queue.currentKing) {
    queue.currentKing = playerObj
    
    // Notify the player that they are now the king
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Joined Queue`,
        description: `<@${playerId}> has joined and is now the King!`,
        fields: [
          { name: 'Waiting for challenger', value: 'Queue up to challenge the King!' }
        ]
      }
    })
  } 
  // If there's a king but no challenger, this player becomes challenger
  else if (queue.currentKing && !queue.challenger) {
    queue.challenger = playerObj
    
    // Notify that a match is starting
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Match Starting`,
        description: `<@${playerId}> has joined as Challenger!`,
        fields: [
          { name: 'King', value: `<@${queue.currentKing.id}>`, inline: true },
          { name: 'Challenger', value: `<@${playerId}>`, inline: true }
        ],
        footer: {
          text: 'Creating lobby information...'
        }
      }
    })
    
    // Create the lobby for the king and challenger
    createLobbyInfo(eventObj, queue)
  } 
  // Otherwise, add to waiting queue
  else {
    waitingQueue.push(playerObj)
    
    // Notify the player that they have joined the waiting queue
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Joined Waiting Queue`,
        description: `<@${playerId}> has joined the waiting queue.`,
        fields: [
          { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
          { name: 'Current Challenger', value: queue.challenger ? `<@${queue.challenger.id}>` : 'None', inline: true },
          { name: 'Queue Position', value: `${waitingQueue.length}`, inline: true },
          { 
            name: 'Waiting Queue', 
            value: waitingQueue.length > 0 
              ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
              : 'No other players waiting' 
          }
        ]
      }
    })
  }
}
