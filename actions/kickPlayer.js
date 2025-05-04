const playerNotInQueue = require('../utils/playerNotInQueue')

// Helper function to check admin permissions (similar to the one in message.js)
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
    console.error('Error checking permissions in kickPlayer.js:', error);
    // Default to true for usability, but you can change this to false for stricter security
    return true;
  }
};

module.exports = (eventObj, queue) => {
  const channel = eventObj.channel
  const playerId = eventObj.author.id
  const mentionedUser = eventObj.mentions.users.first()

  // Check if the user has admin permissions using our safe helper function
  const hasPermission = checkAdminPermissions(eventObj, playerId);

  if (!hasPermission) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Permission Denied`,
        description: `<@${playerId}>, you don't have permission to kick players.`
      }
    })
    return
  }

  // Player is not in the queue
  if (playerNotInQueue({ playerId, channel, queue })) return

  // No player was mentioned
  if (!mentionedUser) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `Please mention a player to kick. Example: !kick @username`
      }
    })
    return
  }

  const mentionedId = mentionedUser.id

  // Check if the mentioned player is in the queue
  if (!queue.playerIdsIndexed[mentionedId]) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `<@${mentionedId}> is not in the queue.`
      }
    })
    return
  }

  // Check if player is the current king
  if (queue.currentKing && queue.currentKing.id === mentionedId) {
    // If there's a challenger, they become the new king
    if (queue.challenger) {
      queue.currentKing = queue.challenger;
      
      // If there are players in waiting queue, get the next challenger
      if (queue.waitingQueue.length > 0) {
        queue.challenger = queue.waitingQueue.shift();
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Player Kicked`,
            description: `<@${mentionedId}> (King) has been kicked from the queue. <@${queue.currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${queue.currentKing.id}>`, inline: true },
              { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
              { 
                name: 'Waiting Queue', 
                value: queue.waitingQueue.length > 0 
                  ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
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
            title: `BTRFLY KotH - Player Kicked`,
            description: `<@${mentionedId}> (King) has been kicked from the queue. <@${queue.currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${queue.currentKing.id}>`, inline: true },
              { name: 'Challenger', value: 'Waiting for players to join', inline: true }
            ]
          }
        });
      }
    } 
    // No challenger, check waiting queue
    else if (queue.waitingQueue.length > 0) {
      queue.currentKing = queue.waitingQueue.shift();
      
      if (queue.waitingQueue.length > 0) {
        queue.challenger = queue.waitingQueue.shift();
        queue.matchInProgress = true;
        queue.readyToJoin = true;
        
        channel.send({
          embed: {
            color: 0x0075F2, // BTRFLY blue
            title: `BTRFLY KotH - Player Kicked`,
            description: `<@${mentionedId}> (King) has been kicked from the queue. <@${queue.currentKing.id}> is now the King!`,
            fields: [
              { name: 'New King', value: `<@${queue.currentKing.id}>`, inline: true },
              { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
              { 
                name: 'Waiting Queue', 
                value: queue.waitingQueue.length > 0 
                  ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
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
            title: `BTRFLY KotH - Player Kicked`,
            description: `<@${mentionedId}> (King) has been kicked from the queue. <@${queue.currentKing.id}> is now the King!`,
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
          title: `BTRFLY KotH - Player Kicked`,
          description: `<@${mentionedId}> (King) has been kicked from the queue. There are no players left in the queue.`,
        }
      });
    }
  } 
  // Check if player is the current challenger
  else if (queue.challenger && queue.challenger.id === mentionedId) {
    // If there are players in waiting queue, get the next challenger
    if (queue.waitingQueue.length > 0) {
      queue.challenger = queue.waitingQueue.shift();
      
      channel.send({
        embed: {
          color: 0x0075F2, // BTRFLY blue
          title: `BTRFLY KotH - Player Kicked`,
          description: `<@${mentionedId}> (Challenger) has been kicked from the queue. <@${queue.challenger.id}> is now the Challenger!`,
          fields: [
            { name: 'King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'New Challenger', value: `<@${queue.challenger.id}>`, inline: true },
            { 
              name: 'Waiting Queue', 
              value: queue.waitingQueue.length > 0 
                ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
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
          title: `BTRFLY KotH - Player Kicked`,
          description: `<@${mentionedId}> (Challenger) has been kicked from the queue. Waiting for a new challenger.`,
          fields: [
            { name: 'King', value: `<@${queue.currentKing.id}>`, inline: true },
            { name: 'Challenger', value: 'Waiting for players to join', inline: true }
          ]
        }
      });
    }
  } 
  // Player is in the waiting queue
  else {
    // Find and remove player from waiting queue
    const playerIndex = queue.waitingQueue.findIndex(p => p.id === mentionedId);
    if (playerIndex !== -1) {
      queue.waitingQueue.splice(playerIndex, 1);
    }
    
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Player Kicked`,
        description: `<@${mentionedId}> has been kicked from the waiting queue.`,
        fields: [
          { 
            name: 'Waiting Queue', 
            value: queue.waitingQueue.length > 0 
              ? queue.waitingQueue.map(p => `<@${p.id}>`).join('\n') 
              : 'No players waiting' 
          }
        ]
      }
    });
  }
  
  // Remove player from indexed players
  delete queue.playerIdsIndexed[mentionedId];
}
