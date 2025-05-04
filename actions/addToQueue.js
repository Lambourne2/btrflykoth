module.exports = (eventObj, queue, mentionedUser) => {
  const channel = eventObj.channel
  const playerId = mentionedUser.id
  const username = mentionedUser.username
  const dmPlayer = async (msg) => await mentionedUser.send(msg)
  
  // Check if the player is already in the queue
  const isInQueue = queue.playerIdsIndexed[playerId]
  
  // Check if player is current king or challenger
  const isKing = queue.currentKing && queue.currentKing.id === playerId
  const isChallenger = queue.challenger && queue.challenger.id === playerId
  
  // The player is already in the queue
  if (isInQueue) {
    if (isKing) {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}> is already the current King!`
        }
      })
    } else if (isChallenger) {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}> is already the current Challenger!`
        }
      })
    } else {
      return channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Already in Queue`,
          description: `<@${playerId}> is already in the waiting queue.`
        }
      })
    }
  }

  // Create player object
  const playerObj = { id: playerId, username, dmPlayer }
  
  // Add player to the appropriate place
  queue.playerIdsIndexed[playerId] = true
  
  // If there's no king, this player becomes king
  if (!queue.currentKing) {
    queue.currentKing = playerObj
    
    // Notify that the player is now the king
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Added to Queue`,
        description: `<@${playerId}> has been added and is now the King!`,
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
        description: `<@${playerId}> has been added as Challenger!`,
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
    require('./createLobbyInfo')(eventObj, queue)
  } 
  // Otherwise, add to waiting queue
  else {
    queue.waitingQueue.push(playerObj)
    
    // Notify that the player has joined the waiting queue
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Added to Waiting Queue`,
        description: `<@${playerId}> has been added to the waiting queue.`,
        fields: [
          { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
          { name: 'Current Challenger', value: queue.challenger ? `<@${queue.challenger.id}>` : 'None', inline: true },
          { name: 'Queue Position', value: `${queue.waitingQueue.length}`, inline: true },
          { 
            name: 'Waiting Queue', 
            value: queue.waitingQueue.length > 0 
              ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
              : 'No other players waiting' 
          }
        ]
      }
    })
  }
}
