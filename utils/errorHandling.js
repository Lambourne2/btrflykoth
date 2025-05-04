// Error handling utility for BTRFLY KotH
// This file contains functions to handle various error scenarios

// Function to handle DM failures
const handleDMFailure = async (player, message, alertChannel) => {
  try {
    await player.dmPlayer(message);
    return true;
  } catch (error) {
    console.error(`Failed to send DM to ${player.username}:`, error);
    
    // Try to notify in the alerts channel
    if (alertChannel) {
      try {
        await alertChannel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - DM Failure Alert`,
            description: `Failed to send direct message to <@${player.id}>. Please ensure your DMs are open.`,
            footer: {
              text: 'This message is visible to admins only'
            }
          }
        });
      } catch (alertError) {
        console.error('Failed to send alert to channel:', alertError);
      }
    }
    return false;
  }
};

// Function to handle match result failures with retries
const handleMatchResultWithRetry = async (queue, winnerId, loserId, messageChannel, maxRetries = 3) => {
  const { handleMatchResult } = require('./managePlayerQueues');
  
  let retries = 0;
  let success = false;
  
  while (retries < maxRetries && !success) {
    try {
      success = handleMatchResult(queue, winnerId, loserId, messageChannel);
      if (success) return true;
      
      // If handleMatchResult returns false but doesn't throw, it's a logical failure
      if (retries === maxRetries - 1) {
        // This is our last retry, notify admins
        if (messageChannel) {
          messageChannel({
            embed: {
              color: 0xFF0000, // Red for error
              title: `BTRFLY KotH - Match Result Error`,
              description: `Failed to process match result after ${maxRetries} attempts. Please contact an administrator.`,
              fields: [
                { name: 'Winner ID', value: winnerId, inline: true },
                { name: 'Loser ID', value: loserId, inline: true }
              ]
            }
          });
        }
      }
    } catch (error) {
      console.error(`Match result processing error (attempt ${retries + 1}):`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    retries++;
  }
  
  return success;
};

// Function to validate queue state
const validateQueueState = (queue, messageChannel) => {
  if (!queue) {
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0xFF0000, // Red for error
          title: `BTRFLY KotH - Queue Error`,
          description: `No active queue found. Please create a new queue.`
        }
      });
    }
    return false;
  }
  
  // Check if queue has necessary properties
  if (!queue.waitingQueue || !queue.playerIdsIndexed) {
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0xFF0000, // Red for error
          title: `BTRFLY KotH - Queue Error`,
          description: `Queue is in an invalid state. Please contact an administrator.`
        }
      });
    }
    return false;
  }
  
  return true;
};

// Function to handle edge case when waiting queue is empty
const handleEmptyWaitingQueue = (queue, messageChannel) => {
  if (!queue.waitingQueue || queue.waitingQueue.length === 0) {
    if (messageChannel) {
      messageChannel({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Waiting for Players`,
          description: queue.currentKing 
            ? `<@${queue.currentKing.id}> is the current King. Waiting for challengers to join.`
            : `No players in queue. Join to become the first King!`
        }
      });
    }
    return true;
  }
  return false;
};

module.exports = {
  handleDMFailure,
  handleMatchResultWithRetry,
  validateQueueState,
  handleEmptyWaitingQueue
};
