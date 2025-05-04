const { deletePlayerQueue } = require('../utils/managePlayerQueues')
const playerNotInQueue = require('../utils/playerNotInQueue')

module.exports = (eventObj, queue) => {
  let { waitingQueue, playerIdsIndexed, currentKing, challenger, lobby } = queue
  const channel = eventObj.channel
  const playerId = eventObj.author.id

  // Player is not in the queue
  if (playerNotInQueue({ playerId, channel, queue })) return

  // Check if player is the current king
  if (currentKing && currentKing.id === playerId) {
    // If there's a challenger, they become the new king
    if (challenger) {
      currentKing = challenger;
      queue.currentKing = challenger;
      
      // If there are players in waiting queue, get the next challenger
      if (waitingQueue.length > 0) {
        queue.challenger = waitingQueue.shift();
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - King Left`,
            description: `<@${playerId}> (King) has left the queue. <@${currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${currentKing.id}>`, inline: true },
              { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
              { 
                name: 'Waiting Queue', 
                value: waitingQueue.length > 0 
                  ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                  : 'No players waiting' 
              }
            ]
          }
        });
        
        // Generate a new lobby password
        queue.lobby.password = require('randomstring').generate({ length: 3 }).toLowerCase();
        
        // Create a new lobby
        require('./createLobbyInfo')(eventObj, queue);
      } else {
        queue.challenger = null;
        queue.matchInProgress = false;
        queue.readyToJoin = false;
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - King Left`,
            description: `<@${playerId}> (King) has left the queue. <@${currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${currentKing.id}>`, inline: true },
              { name: 'Challenger', value: 'Waiting for players to join', inline: true }
            ]
          }
        });
      }
    } 
    // No challenger, check waiting queue
    else if (waitingQueue.length > 0) {
      queue.currentKing = waitingQueue.shift();
      
      if (waitingQueue.length > 0) {
        queue.challenger = waitingQueue.shift();
        queue.matchInProgress = true;
        queue.readyToJoin = true;
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - King Left`,
            description: `<@${playerId}> (King) has left the queue. <@${queue.currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${queue.currentKing.id}>`, inline: true },
              { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
              { 
                name: 'Waiting Queue', 
                value: waitingQueue.length > 0 
                  ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                  : 'No players waiting' 
              }
            ]
          }
        });
        
        // Generate a new lobby password
        queue.lobby.password = require('randomstring').generate({ length: 3 }).toLowerCase();
        
        // Create a new lobby
        require('./createLobbyInfo')(eventObj, queue);
      } else {
        queue.challenger = null;
        queue.matchInProgress = false;
        queue.readyToJoin = false;
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - King Left`,
            description: `<@${playerId}> (King) has left the queue. <@${queue.currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${queue.currentKing.id}>`, inline: true },
              { name: 'Challenger', value: 'Waiting for players to join', inline: true }
            ]
          }
        });
      }
    } 
    // No challenger and no waiting queue
    else {
      queue.currentKing = null;
      queue.challenger = null;
      queue.matchInProgress = false;
      queue.readyToJoin = false;
      
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - King Left`,
          description: `<@${playerId}> (King) has left the queue. There are no players left in the queue.`,
        }
      });
    }
  } 
  // Check if player is the current challenger
  else if (challenger && challenger.id === playerId) {
    // If there are players in waiting queue, get the next challenger
    if (waitingQueue.length > 0) {
      queue.challenger = waitingQueue.shift();
      
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Challenger Left`,
          description: `<@${playerId}> (Challenger) has left the queue. <@${queue.challenger.id}> is now the Challenger!`,
          fields: [
            { name: 'King', value: `<@${currentKing.id}>`, inline: true },
            { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
            { 
              name: 'Waiting Queue', 
              value: waitingQueue.length > 0 
                ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                : 'No players waiting' 
            }
          ]
        }
      });
      
      // Generate a new lobby password
      queue.lobby.password = require('randomstring').generate({ length: 3 }).toLowerCase();
      
      // Create a new lobby
      require('./createLobbyInfo')(eventObj, queue);
    } else {
      queue.challenger = null;
      queue.matchInProgress = false;
      queue.readyToJoin = false;
      
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Challenger Left`,
          description: `<@${playerId}> (Challenger) has left the queue. Waiting for a new challenger.`,
          fields: [
            { name: 'King', value: `<@${currentKing.id}>`, inline: true },
            { name: 'Challenger', value: 'Waiting for players to join', inline: true }
          ]
        }
      });
    }
  } 
  // Player is in the waiting queue
  else {
    // Find and remove player from waiting queue
    const playerIndex = waitingQueue.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      waitingQueue.splice(playerIndex, 1);
    }
    
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Player Left`,
        description: `<@${playerId}> has left the waiting queue.`,
        fields: [
          { 
            name: 'Waiting Queue', 
            value: waitingQueue.length > 0 
              ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
              : 'No players waiting' 
          }
        ]
      }
    });
  }
  
  // Remove player from indexed players
  delete playerIdsIndexed[playerId];

  // If no players left, delete the queue
  if (Object.keys(playerIdsIndexed).length === 0) {
    deletePlayerQueue(lobby.id);
  }
}
