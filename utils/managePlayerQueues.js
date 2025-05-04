const randomstring = require('randomstring')
const playerIdsIndexedToMentions = require('../utils/playerIdsIndexedToMentions')
const { commandToString } = require('./commands')
const { lobbyName } = process.env
const cloneDeep = require('lodash.clonedeep')
const { generateLobbyCode } = require('./lobbyCodeGenerator')

let lobbyId = 0

const queueResetValues = {
  waitingQueue: [],
  currentKing: null,
  challenger: null,
  matchInProgress: false,
  readyToJoin: false,
  isPaused: false,
}

function createQueue() {
  const lobbyCode = generateLobbyCode();
  return {
    waitingQueue: [],
    playerIdsIndexed: {},
    currentKing: null,
    challenger: null,
    ...cloneDeep(queueResetValues),
    lobby: {
      id: ++lobbyId,
      name: lobbyCode,
      password: lobbyCode,
    },
  }
}

// Function to generate new lobby details
function generateNewLobbyDetails(queue) {
  const lobbyCode = generateLobbyCode();
  queue.lobby.name = lobbyCode;
  queue.lobby.password = lobbyCode;
  return queue;
}

let queues = []

// Helper function to check if command is a queue command
const isQueueCommand = (command) => {
  return command === commandToString.queue || 
         command === commandToString.q || 
         command === commandToString.join || 
         command === commandToString.j;
}

const determinePlayerQueue = (playerId, command) => {
  if (queues.length === 0 && isQueueCommand(command)) {
    // They are no existing queues yet, make the first one
    const queue = createQueue()
    queues.push(queue)

    return queue
  } else if (queues.length === 0 && !isQueueCommand(command)) {
    // There are no existing queues yet, but player did not try to queue
    return undefined
  }

  // There are existing queues
  // Attempt to find player's queue
  const playersQueue = queues.find((queueObj) => queueObj.playerIdsIndexed[playerId])

  // Player is already in a queue
  if (playersQueue) return playersQueue

  // Player is not in a queue yet
  if (!playersQueue && isQueueCommand(command)) {
    const notFullQueue = queues.find((queueObj) => {
      // Check if player is not the current king or challenger
      const isNotKingOrChallenger = 
        (!queueObj.currentKing || queueObj.currentKing.id !== playerId) && 
        (!queueObj.challenger || queueObj.challenger.id !== playerId);
      
      return isNotKingOrChallenger;
    })

    // Player can join an existing queue
    if (notFullQueue) return notFullQueue

    // Player needs a new queue to be created for them
    const queue = createQueue()
    queues.push(queue)

    return queue
  } else {
    // Player is not in a queue and did not attempt to queue
    return undefined
  }
}

const deletePlayerQueue = (lobbyId) => {
  if (typeof lobbyId !== 'number') return

  const queueIndex = queues.findIndex((queueObj) => queueObj.lobby.id === lobbyId)
  queues.splice(queueIndex, 1)
}

const removeOfflinePlayerFromQueue = ({ playerId, playerChannels }) => {
  if (queues.length === 0) return

  const playersQueue = queues.find((queueObj) => queueObj.playerIdsIndexed[playerId])

  if (!playersQueue) return

  // The player is in a queue but logged out without leaving the queue
  delete playersQueue.playerIdsIndexed[playerId]
  
  // Check if player is in waiting queue
  playersQueue.waitingQueue = playersQueue.waitingQueue.filter(player => player.id !== playerId)
  
  // Check if player is the current king
  if (playersQueue.currentKing && playersQueue.currentKing.id === playerId) {
    // Current king went offline, promote challenger if exists
    if (playersQueue.challenger) {
      playersQueue.currentKing = playersQueue.challenger
      playersQueue.challenger = null
      
      // Get next challenger if available
      if (playersQueue.waitingQueue.length > 0) {
        playersQueue.challenger = playersQueue.waitingQueue.shift()
        playersQueue.matchInProgress = true
        playersQueue.readyToJoin = true
        
        // Generate new lobby details
        generateNewLobbyDetails(playersQueue);
      } else {
        playersQueue.matchInProgress = false
        playersQueue.readyToJoin = false
      }
    } else {
      // No challenger, check waiting queue
      if (playersQueue.waitingQueue.length > 0) {
        playersQueue.currentKing = playersQueue.waitingQueue.shift()
        
        if (playersQueue.waitingQueue.length > 0) {
          playersQueue.challenger = playersQueue.waitingQueue.shift()
          playersQueue.matchInProgress = true
          playersQueue.readyToJoin = true
          
          // Generate new lobby details
          generateNewLobbyDetails(playersQueue);
        } else {
          playersQueue.challenger = null
          playersQueue.matchInProgress = false
          playersQueue.readyToJoin = false
        }
      } else {
        // No players left
        playersQueue.currentKing = null
        playersQueue.challenger = null
        playersQueue.matchInProgress = false
        playersQueue.readyToJoin = false
      }
    }
  }
  
  // Check if player is the challenger
  if (playersQueue.challenger && playersQueue.challenger.id === playerId) {
    // Challenger went offline, get next challenger if available
    if (playersQueue.waitingQueue.length > 0) {
      playersQueue.challenger = playersQueue.waitingQueue.shift()
      playersQueue.matchInProgress = true
      playersQueue.readyToJoin = true
      
      // Generate new lobby details
      generateNewLobbyDetails(playersQueue);
    } else {
      playersQueue.challenger = null
      playersQueue.matchInProgress = false
      playersQueue.readyToJoin = false
    }
  }

  const channel = playerChannels.find((channelObj) => channelObj.name === process.env.channelName)

  if (Object.keys(playersQueue.playerIdsIndexed).length === 0) {
    // No players are in the queue now
    deletePlayerQueue(playersQueue.lobby.id)
  } else {
    // Notify the other players in the queue of the removal
    if (channel) {
      let description = `<@${playerId}> was removed from the queue because they went offline.`;
      
      // Add information about king/challenger changes if applicable
      if (playersQueue.currentKing) {
        description += `\n\nCurrent King: <@${playersQueue.currentKing.id}>`;
        
        if (playersQueue.challenger) {
          description += `\nCurrent Challenger: <@${playersQueue.challenger.id}>`;
        } else {
          description += `\nWaiting for a challenger...`;
        }
      }
      
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Player removed`,
          description: description,
          fields: [
            { 
              name: 'Players in waiting queue', 
              value: playersQueue.waitingQueue.length > 0 
                ? playersQueue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                : 'No players waiting'
            },
            { name: 'Match in progress', value: playersQueue.matchInProgress, inline: true },
            { name: 'Lobby Ready', value: playersQueue.readyToJoin, inline: true },
          ],
        },
      })
    }
  }
}

const kickPlayer = (playerIndex, queue, messageChannel) => {
  const playerObj = queue.waitingQueue[playerIndex]
  const playerId = playerObj.id

  delete queue.playerIdsIndexed[playerId]
  queue.waitingQueue.splice(playerIndex, 1)

  if (messageChannel) {
    messageChannel(`<@${playerId}> has been kicked. You can check the lobby status with ${commandToString.status}`)
  }
}

const resetPlayerQueue = (lobbyId) => {
  const queueIndex = queues.findIndex((queueObj) => queueObj.lobby.id === lobbyId)
  queues[queueIndex] = Object.assign({}, queues[queueIndex], cloneDeep(queueResetValues))
}

// Function to toggle pause state
const togglePauseQueue = (queue, messageChannel) => {
  queue.isPaused = !queue.isPaused;
  
  if (messageChannel) {
    messageChannel({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Queue ${queue.isPaused ? 'Paused' : 'Resumed'}`,
        description: queue.isPaused 
          ? `The queue has been paused. The !win command is disabled until resumed.`
          : `The queue has been resumed. The !win command is now enabled.`,
        fields: [
          { name: 'Queue Status', value: queue.isPaused ? 'Paused' : 'Active', inline: true },
        ],
      },
    });
  }
  
  return queue.isPaused;
}

// New function to handle match results
const handleMatchResult = (queue, winnerId, loserId, messageChannel) => {
  // Check if queue is paused
  if (queue.isPaused) {
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Queue Paused`,
          description: `Cannot report match results while the queue is paused. Please wait for an admin to resume the queue.`,
        },
      });
    }
    return false;
  }
  
  // Ensure the winner and loser are valid
  if (!queue.playerIdsIndexed[winnerId] || !queue.playerIdsIndexed[loserId]) {
    if (messageChannel) {
      messageChannel("Error: One or both players are not in the queue.")
    }
    return false;
  }
  
  // Find the winner and loser player objects
  const winner = queue.currentKing && queue.currentKing.id === winnerId 
    ? queue.currentKing 
    : queue.challenger;
    
  const loser = queue.currentKing && queue.currentKing.id === loserId 
    ? queue.currentKing 
    : queue.challenger;
  
  if (!winner || !loser) {
    if (messageChannel) {
      messageChannel("Error: Could not identify winner or loser in the current match.")
    }
    return false;
  }
  
  // Set the winner as the new king
  queue.currentKing = winner;
  
  // Add the loser to the back of the waiting queue
  queue.waitingQueue.push(loser);
  
  // Generate new lobby details
  generateNewLobbyDetails(queue);
  
  // Get the next challenger if available
  if (queue.waitingQueue.length > 0) {
    queue.challenger = queue.waitingQueue.shift();
    queue.matchInProgress = true;
    queue.readyToJoin = true;
    
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Match Result`,
          description: `🏆 <@${winner.id}> defeated <@${loser.id}>! Next up: <@${winner.id}> vs. <@${queue.challenger.id}>.`,
          fields: [
            { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'Next Challenger', value: `<@${queue.challenger.id}>`, inline: true },
            { 
              name: 'Waiting Queue', 
              value: queue.waitingQueue.length > 0 
                ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                : 'No players waiting' 
            },
          ],
        },
      });
    }
    
    return true;
  } else {
    // No challenger available
    queue.challenger = null;
    queue.matchInProgress = false;
    queue.readyToJoin = false;
    
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Match Result`,
          description: `🏆 <@${winner.id}> defeated <@${loser.id}>! Waiting for more players to join the queue.`,
          fields: [
            { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'Next Challenger', value: 'Waiting for players to join', inline: true },
          ],
        },
      });
    }
    
    return false;
  }
}

// New function to skip the current challenger
const skipChallenger = (queue, messageChannel) => {
  if (!queue.challenger) {
    if (messageChannel) {
      messageChannel("There is no current challenger to skip.")
    }
    return false;
  }
  
  // Move current challenger to the back of the waiting queue
  const skippedChallenger = queue.challenger;
  queue.waitingQueue.push(skippedChallenger);
  
  // Generate new lobby details
  generateNewLobbyDetails(queue);
  
  // Get the next challenger if available
  if (queue.waitingQueue.length > 0) {
    queue.challenger = queue.waitingQueue.shift();
    queue.matchInProgress = true;
    queue.readyToJoin = true;
    
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Challenger Skipped`,
          description: `<@${skippedChallenger.id}> has been skipped. Next up: <@${queue.currentKing.id}> vs. <@${queue.challenger.id}>.`,
          fields: [
            { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'Next Challenger', value: `<@${queue.challenger.id}>`, inline: true },
            { 
              name: 'Waiting Queue', 
              value: queue.waitingQueue.length > 0 
                ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
                : 'No players waiting' 
            },
          ],
        },
      });
    }
    
    return true;
  } else {
    // No challenger available
    queue.challenger = null;
    queue.matchInProgress = false;
    queue.readyToJoin = false;
    
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Challenger Skipped`,
          description: `<@${skippedChallenger.id}> has been skipped. Waiting for more players to join the queue.`,
          fields: [
            { name: 'Current King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'Next Challenger', value: 'Waiting for players to join', inline: true },
          ],
        },
      });
    }
    
    return false;
  }
}

// New function to clear the queue
const clearQueue = (queue, messageChannel) => {
  // Reset the queue
  queue.waitingQueue = [];
  queue.currentKing = null;
  queue.challenger = null;
  queue.matchInProgress = false;
  queue.readyToJoin = false;
  queue.playerIdsIndexed = {};
  queue.isPaused = false;
  
  // Generate new lobby details
  generateNewLobbyDetails(queue);
  
  if (messageChannel) {
    messageChannel({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Queue Cleared`,
        description: `The queue has been cleared. All players have been removed.`,
      },
    });
  }
  
  return true;
}

module.exports = {
  determinePlayerQueue,
  deletePlayerQueue,
  removeOfflinePlayerFromQueue,
  kickPlayer,
  resetPlayerQueue,
  handleMatchResult,
  skipChallenger,
  clearQueue,
  togglePauseQueue,
  generateNewLobbyDetails,
  isQueueCommand
}
