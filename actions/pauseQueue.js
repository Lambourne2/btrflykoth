const { togglePauseQueue } = require('../utils/managePlayerQueues');

module.exports = (eventObj, queue) => {
  const channel = eventObj.channel;
  const playerId = eventObj.author.id;
  
  // Check if user has admin permissions
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
      console.error('Error checking permissions in pauseQueue.js:', error);
      // Default to true for usability, but you can change this to false for stricter security
      return true;
    }
  };
  
  // Check if user has admin permissions
  const hasPermission = checkAdminPermissions(eventObj, playerId);
  
  if (!hasPermission) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Permission Denied`,
        description: `<@${playerId}>, you don't have permission to pause/resume the queue.`
      }
    });
    return;
  }
  
  // If no queue exists, create a message
  if (!queue) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `There is no active queue to pause/resume.`
      }
    });
    return;
  }
  
  // Toggle the pause state
  togglePauseQueue(queue, (message) => {
    if (typeof message === 'string') {
      channel.send(message);
    } else {
      channel.send(message);
    }
  });
}
