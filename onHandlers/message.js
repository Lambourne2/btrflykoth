// Actions
const {
  enterQueue,
  leaveQueue,
  getQueueStatus,
  sendCommandList,
  kickPlayer,
  winMatch,
  skipChallenger,
  clearQueue,
  addToQueue,
  pauseQueue
} = require('../actions')

// Queue Management
const { determinePlayerQueue } = require('../utils/managePlayerQueues')

// Commands
const { commandToString, validCommandCheck } = require('../utils/commands')

// Environment Variables
const { NODE_ENV, channelName, debugLogs } = process.env

// Helper function to check admin permissions
const checkAdminPermissions = (eventObj, playerId) => {
  try {
    // Check if the user is in the guild
    const guild = eventObj.guild;
    if (!guild) {
      console.log('Guild not found in event object');
      return true; // Default to allowing commands in DMs or when guild can't be determined
    }
    
    // Check if members and cache exist
    if (!guild.members || !guild.members.cache) {
      console.log('Guild members cache not available');
      
      // Try to use eventObj.member as fallback
      if (eventObj.member) {
        // Check if the member is the message author
        if (eventObj.member.id === playerId) {
          // Try different permission checking methods based on Discord.js version
          if (typeof eventObj.member.permissions?.has === 'function') {
            return eventObj.member.permissions.has('ADMINISTRATOR') || 
                   eventObj.member.permissions.has('MANAGE_ROLES') ||
                   (eventObj.member.roles?.cache?.some && 
                    eventObj.member.roles.cache.some(role => role.name === 'BTRFLY Admin'));
          } else if (typeof eventObj.member.hasPermission === 'function') {
            return eventObj.member.hasPermission('ADMINISTRATOR') || 
                   eventObj.member.hasPermission('MANAGE_ROLES') ||
                   (eventObj.member.roles?.cache?.some && 
                    eventObj.member.roles.cache.some(role => role.name === 'BTRFLY Admin'));
          }
        }
      }
      
      // If we can't determine permissions, default to true for usability
      return true;
    }
    
    // Get the member using the collection
    const member = guild.members.cache.get(playerId);
    if (!member) {
      console.log('Member not found in cache');
      return false;
    }
    
    // Check permissions using different methods based on Discord.js version
    if (typeof member.permissions?.has === 'function') {
      return member.permissions.has('ADMINISTRATOR') || 
             member.permissions.has('MANAGE_ROLES') ||
             (member.roles?.cache?.some && 
              member.roles.cache.some(role => role.name === 'BTRFLY Admin'));
    } else if (typeof member.hasPermission === 'function') {
      return member.hasPermission('ADMINISTRATOR') || 
             member.hasPermission('MANAGE_ROLES') ||
             (member.roles?.cache?.some && 
              member.roles.cache.some(role => role.name === 'BTRFLY Admin'));
    }
    
    // If we can't determine permissions, default to false
    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    // Default to true for usability, but you can change this to false for stricter security
    return true;
  }
};

module.exports = async (eventObj, botUser = { id: undefined }) => {
  const msg = eventObj.content.trim().toLowerCase()
  const type = eventObj.channel.type
  const isCommand = msg.startsWith('!')
  const authorId = eventObj.author.id
  const commonLogCheck = debugLogs === 'true' && authorId !== botUser.id

  if (channelName && eventObj.channel.name !== channelName) {
    if (commonLogCheck) {
      console.log('The user is typing on a different channel, disregarding message')
      console.log(eventObj.channel.name + ' !== ' + channelName)
    }

    return
  }

  if (!isCommand) {
    if (commonLogCheck) {
      console.log('The user is not typing a BTRFLY KotH command, disregarding message')
    }

    return
  }

  if (NODE_ENV !== 'development' && type === 'dm') {
    if (commonLogCheck) {
      console.log('The user is direct messaging the bot, disregarding message')
    }

    return
  }

  // Don't execute any logic on bot messages
  if (authorId === botUser.id) return

  const channel = eventObj.channel
  const commandParts = msg.split(' ')
  const command = commandParts[0]
  const playerId = eventObj.author.id
  
  // Special handling for "!queue add @user" command
  if (msg.startsWith(commandToString.add)) {
    // Check if user has admin permissions
    const hasPermission = checkAdminPermissions(eventObj, playerId);
    
    if (!hasPermission) {
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Permission Denied`,
          description: `<@${playerId}>, you don't have permission to use admin commands.`
        }
      });
      return;
    }
    
    // Extract mentioned user
    const mentionedUser = eventObj.mentions.users.first();
    if (!mentionedUser) {
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Error`,
          description: `Please mention a user to add to the queue. Example: ${commandToString.add} @username`
        }
      });
      return;
    }
    
    // Create a queue if it doesn't exist
    const queue = determinePlayerQueue(playerId, commandToString.queue) || 
                  determinePlayerQueue(mentionedUser.id, commandToString.queue);
    
    if (queue) {
      // Add the mentioned user to the queue
      addToQueue(eventObj, queue, mentionedUser);
    }
    return;
  }
  
  // Handle other commands
  const queue = determinePlayerQueue(playerId, command)

  // For most commands, the user needs to be in a queue
  if (isCommand && !queue && validCommandCheck[command] && 
      command !== commandToString.help && command !== commandToString.clear &&
      command !== commandToString.pause) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Not in Queue`,
        description: `<@${playerId}>, you have not entered the queue. Type ${commandToString.queue} to join!`
      }
    });
    return;
  }

  // Admin commands that require permission checks
  if (command === commandToString.skip || command === commandToString.clear || 
      command === commandToString.pause) {
    // Check if user has admin permissions
    const hasPermission = checkAdminPermissions(eventObj, playerId);
    
    if (!hasPermission) {
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Permission Denied`,
          description: `<@${playerId}>, you don't have permission to use admin commands.`
        }
      });
      return;
    }
  }

  switch (command) {
    // Queue command and its aliases
    case commandToString.queue:
    case commandToString.q:
    case commandToString.join:
    case commandToString.j:
      enterQueue(eventObj, queue)
      break
    
    // Leave command and its alias
    case commandToString.leave:
    case commandToString.l:
      leaveQueue(eventObj, queue)
      break
    
    case commandToString.status:
      getQueueStatus(eventObj, queue)
      break
    
    case commandToString.win:
      // Extract mentioned user as the loser
      const mentionedUser = eventObj.mentions.users.first();
      if (!mentionedUser) {
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Error`,
            description: `Please mention the player you defeated. Example: ${commandToString.win} @username`
          }
        });
        return;
      }
      
      // Check if the mentioned user is the current king or challenger
      if (queue.currentKing && queue.challenger && 
          (queue.currentKing.id === mentionedUser.id || queue.challenger.id === mentionedUser.id) &&
          (queue.currentKing.id === playerId || queue.challenger.id === playerId)) {
        winMatch(eventObj, queue, playerId, mentionedUser.id);
      } else {
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Error`,
            description: `Both you and the mentioned player must be in the current match (King vs Challenger).`
          }
        });
      }
      break
    
    case commandToString.skip:
      if (queue) {
        skipChallenger(eventObj, queue);
      } else {
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Error`,
            description: `There is no active queue to skip a challenger from.`
          }
        });
      }
      break
    
    case commandToString.clear:
      // Create a queue if it doesn't exist
      const queueToClear = queue || determinePlayerQueue(playerId, commandToString.queue);
      
      if (queueToClear) {
        clearQueue(eventObj, queueToClear);
      } else {
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Error`,
            description: `There is no active queue to clear.`
          }
        });
      }
      break
    
    case commandToString.pause:
      // Create a queue if it doesn't exist
      const queueToPause = queue || determinePlayerQueue(playerId, commandToString.queue);
      
      if (queueToPause) {
        pauseQueue(eventObj, queueToPause);
      } else {
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Error`,
            description: `There is no active queue to pause/resume.`
          }
        });
      }
      break
    
    case commandToString.help:
      sendCommandList(eventObj)
      break
    
    case commandToString.kick:
      kickPlayer(eventObj, queue)
      break
    
    default:
      return
  }

  if (queue && commonLogCheck) {
    console.log('Found queue:', queue)
  }
}
