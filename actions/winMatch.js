const { handleMatchResultWithRetry } = require('../utils/errorHandling');
const createLobbyInfo = require('./createLobbyInfo');

module.exports = (eventObj, queue, winnerId, loserId) => {
  const channel = eventObj.channel
  
  // Validate that both players are in the current match
  if (!queue.currentKing || !queue.challenger) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `There is no active match in progress.`
      }
    })
    return
  }
  
  const kingId = queue.currentKing.id
  const challengerId = queue.challenger.id
  
  if ((winnerId !== kingId && winnerId !== challengerId) || 
      (loserId !== kingId && loserId !== challengerId)) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `Both players must be in the current match (King vs Challenger).`
      }
    })
    return
  }
  
  // Check if queue is paused
  if (queue.isPaused) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Queue Paused`,
        description: `Cannot report match results while the queue is paused. Please wait for an admin to resume the queue.`
      }
    })
    return
  }
  
  // Process the match result with retry logic
  handleMatchResultWithRetry(queue, winnerId, loserId, (message) => {
    if (typeof message === 'string') {
      channel.send(message)
    } else {
      channel.send(message)
    }
  }).then(success => {
    // If match result was processed successfully and there's a new match ready
    if (success && queue.currentKing && queue.challenger) {
      // Send new lobby details to players
      createLobbyInfo(eventObj, queue);
    }
  }).catch(error => {
    console.error('Error processing match result:', error);
    channel.send({
      embed: {
        color: 0xFF0000, // Red for error
        title: `BTRFLY KotH - Error`,
        description: `An error occurred while processing the match result. Please try again or contact an administrator.`
      }
    });
  });
}
