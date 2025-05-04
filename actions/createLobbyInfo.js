const { handleDMFailure } = require('../utils/errorHandling');

const { lobbyRegion, lobbySeries } = process.env

module.exports = async (eventObj, queue) => {
  const { currentKing, challenger, lobby } = queue
  const channel = eventObj.channel

  // Ensure we have both a king and challenger
  if (!currentKing || !challenger) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: 'Cannot create lobby: Missing king or challenger',
      },
    })
    return
  }

  // Both players need to create/join the lobby
  const readyEmbed = {
    embed: {
      color: 0x0075F2, // BTRFLY blue
      title: `BTRFLY KotH - Match Ready`,
      description: 'A new 1v1 match is ready!',
      fields: [
        {
          name: 'King',
          value: `<@${currentKing.id}>`,
          inline: true
        },
        {
          name: 'Challenger',
          value: `<@${challenger.id}>`,
          inline: true
        },
        {
          name: 'Lobby Creator',
          value: `<@${currentKing.id}>`,
        },
      ],
      footer: {
        text: 'Check your DMs for lobby details'
      }
    },
  }

  // Find alerts channel safely
  const getAlertsChannel = () => {
    try {
      // Check if guild exists
      if (!channel.guild) return null;
      
      // Check if channels cache exists
      if (!channel.guild.channels || !channel.guild.channels.cache) return null;
      
      // Try to find the alerts channel
      return channel.guild.channels.cache.find(c => c.name === 'alerts');
    } catch (error) {
      console.error('Error finding alerts channel:', error);
      return null;
    }
  };

  // Check if a user is likely a bot
  const isLikelyBot = (player) => {
    // Check for bot property if available
    if (player.bot !== undefined) return player.bot;
    
    // Check if user has a dmPlayer method that's not our custom one
    if (!player.dmPlayer || typeof player.dmPlayer !== 'function') return true;
    
    // Some common bot username patterns
    const botPatterns = [
      /bot$/i,         // Ends with "bot"
      /^bot/i,         // Starts with "bot"
      /-bot/i,         // Contains "-bot"
      /server/i,       // Contains "server"
      /stats/i,        // Contains "stats"
      /queue/i,        // Contains "queue"
      /rank/i          // Contains "rank"
    ];
    
    // Check if username matches any bot patterns
    if (player.username && typeof player.username === 'string') {
      return botPatterns.some(pattern => pattern.test(player.username));
    }
    
    return false;
  };

  // Function to directly DM the admin (lambourne)
  const sendAdminDM = async (message) => {
    // Admin ID (lambourne)
    const adminId = '207228118715334656';
    let adminUser = null;
    
    try {
      // Try multiple methods to find and DM the admin
      
      // Method 1: Check if admin is in the current match or waiting queue
      if (currentKing && currentKing.id === adminId && currentKing.dmPlayer) {
        await currentKing.dmPlayer(message);
        return true;
      }
      
      if (challenger && challenger.id === adminId && challenger.dmPlayer) {
        await challenger.dmPlayer(message);
        return true;
      }
      
      if (queue.waitingQueue) {
        const adminInQueue = queue.waitingQueue.find(player => player.id === adminId);
        if (adminInQueue && adminInQueue.dmPlayer) {
          await adminInQueue.dmPlayer(message);
          return true;
        }
      }
      
      // Method 2: Try to find admin in guild members
      if (channel.guild && channel.guild.members && channel.guild.members.cache) {
        const member = channel.guild.members.cache.get(adminId);
        if (member && member.user) {
          await member.user.send(message);
          return true;
        }
      }
      
      // Method 3: Try to use client.users collection if available
      if (eventObj.client && eventObj.client.users) {
        // Try different methods based on Discord.js version
        if (typeof eventObj.client.users.fetch === 'function') {
          // Newer Discord.js
          const user = await eventObj.client.users.fetch(adminId).catch(() => null);
          if (user) {
            await user.send(message);
            return true;
          }
        } else if (eventObj.client.users.cache) {
          // Try cache
          const user = eventObj.client.users.cache.get(adminId);
          if (user) {
            await user.send(message);
            return true;
          }
        } else if (eventObj.client.users.get) {
          // Older Discord.js
          const user = eventObj.client.users.get(adminId);
          if (user) {
            await user.send(message);
            return true;
          }
        }
      }
      
      // Method 4: Try to find admin in message mentions or channel members
      if (eventObj.mentions && eventObj.mentions.users) {
        const user = eventObj.mentions.users.get(adminId);
        if (user) {
          await user.send(message);
          return true;
        }
      }
      
      // If all methods fail, log the error but don't send to channel
      console.error('Could not find admin user to DM. Lobby details not sent to admin.');
      return false;
      
    } catch (error) {
      console.error('Failed to send DM to admin:', error);
      return false;
    }
  };

  function sendLobbyInfo(player, role) {
    // Get alerts channel safely
    const alertsChannel = getAlertsChannel();
    
    // Skip DM attempts for bots
    if (isLikelyBot(player)) {
      console.log(`Skipping DM to likely bot: ${player.username || player.id}`);
      return;
    }
    
    // Try to send the ready embed
    handleDMFailure(player, readyEmbed, alertsChannel);

    // Try to send the lobby details
    const lobbyDetailsEmbed = {
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Lobby Details`,
        description: `You are the current ${role}. Use this information to join the private match:`,
        fields: [
          {
            name: 'Lobby Name',
            value: lobby.name,
          },
          {
            name: 'Lobby Password',
            value: lobby.password,
          },
          {
            name: 'Series Length (mutator)',
            value: lobbySeries,
          },
          {
            name: 'Region',
            value: lobbyRegion,
          },
        ],
        footer: {
          text: 'Report match results in the Discord channel when finished'
        }
      },
    };
    
    handleDMFailure(player, lobbyDetailsEmbed, alertsChannel);
  }

  // DM King (if not a bot)
  sendLobbyInfo(currentKing, 'King')
  
  // DM Challenger (if not a bot)
  sendLobbyInfo(challenger, 'Challenger')
  
  // Always send lobby details to admin (lambourne) via DM only
  // Create a special admin embed with both players' information
  const adminLobbyEmbed = {
    embed: {
      color: 0x0075F2, // BTRFLY blue
      title: `BTRFLY KotH - Admin Lobby Details`,
      description: `New match: <@${currentKing.id}> vs <@${challenger.id}>. Use this information to spectate the match:`,
      fields: [
        {
          name: 'Lobby Name',
          value: lobby.name,
        },
        {
          name: 'Lobby Password',
          value: lobby.password,
        },
        {
          name: 'Series Length (mutator)',
          value: lobbySeries,
        },
        {
          name: 'Region',
          value: lobbyRegion,
        },
        {
          name: 'King',
          value: `<@${currentKing.id}>`,
          inline: true
        },
        {
          name: 'Challenger',
          value: `<@${challenger.id}>`,
          inline: true
        }
      ],
      footer: {
        text: 'You are receiving this as the match admin'
      }
    },
  };
  
  // Send DM to admin without channel fallback
  sendAdminDM(adminLobbyEmbed);

  // Inform the channel that everything is ready
  channel.send(readyEmbed)

  // Set the ready to go flag to true
  queue.matchInProgress = true
  queue.readyToJoin = true
}
