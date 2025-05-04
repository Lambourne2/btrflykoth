# Key Changes from 6mans-JS to BTRFLY-KotH

This document outlines the major changes made to convert the original 6mans-JS repository into the BTRFLY King of the Hill (KotH) system.

## 1. Queue Logic Changes

### Before (Team-based 3v3):
```javascript
// Original queue structure in managePlayerQueues.js
const queueResetValues = {
  votingInProgress: false,
  votes: {
    r: 0,
    c: 0,
    playersWhoVoted: {},
  },
  creatingTeamsInProgress: false,
  teams: {
    blue: {
      players: [],
      captain: undefined,
      voiceChannelID: undefined,
      voiceChannelHistory: {},
    },
    orange: {
      players: [],
      captain: undefined,
      voiceChannelID: undefined,
      voiceChannelHistory: {},
    },
  },
  readyToJoin: false,
}
```

### After (King of the Hill 1v1):
```javascript
// New queue structure for King of the Hill
const queueResetValues = {
  waitingQueue: [],
  currentKing: null,
  challenger: null,
  matchInProgress: false,
  readyToJoin: false,
}
```

## 2. Lobby Setup Changes

### Before (3v3 Teams):
```javascript
// Original lobby creation in createLobbyInfo.js
function sendLobbyInfo(players) {
  players.forEach((player) => {
    player.dmPlayer(readyEmbed)

    player.dmPlayer({
      embed: {
        color: 2201331,
        title: `Lobby ${lobby.name} - Details`,
        description: 'Use this information to join the private match',
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
      },
    })
  })
}

// DM Blue Team
sendLobbyInfo(teams.blue.players)
// DM Orange Team
sendLobbyInfo(teams.orange.players)
```

### After (1v1 King vs Challenger):
```javascript
// New lobby creation for King of the Hill
function sendLobbyInfo(player, role) {
  handleDMFailure(player, readyEmbed, channel.guild.channels.cache.find(c => c.name === 'alerts'));

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
  
  handleDMFailure(player, lobbyDetailsEmbed, channel.guild.channels.cache.find(c => c.name === 'alerts'));
}

// DM King
sendLobbyInfo(currentKing, 'King')

// DM Challenger
sendLobbyInfo(challenger, 'Challenger')
```

## 3. Command Changes

### Before:
```javascript
// Original commands in commands.js
exports.commandToString = {
  queue: '!6m-q',
  leave: '!6m-leave',
  status: '!6m-status',
  votestatus: '!6m-votestatus',
  r: '!6m-r',
  c: '!6m-c',
  help: '!6m-help',
  kick: '!6m-kick',
}
```

### After:
```javascript
// New commands for BTRFLY KotH
exports.commandToString = {
  queue: '!queue',
  leave: '!leave',
  status: '!status',
  win: '!win',
  skip: '!skip',
  clear: '!clear',
  help: '!help',
  kick: '!kick',
  add: '!queue add',
}
```

## 4. New Admin Commands

### Added `!win` Command:
```javascript
// New win command to report match results
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
    createWinAction(eventObj, queue, playerId, mentionedUser.id);
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
```

### Added `!skip` Command:
```javascript
// New skip command to skip the current challenger
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
```

### Added `!clear` Command:
```javascript
// New clear command to reset the queue
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
```

### Added `!queue add` Command:
```javascript
// New queue add command to add a user to the queue
if (msg.startsWith(commandToString.add)) {
  // Check if user has admin permissions
  const member = await eventObj.guild.members.fetch(playerId);
  const hasPermission = member.permissions.has('ADMINISTRATOR') || 
                        member.permissions.has('MANAGE_ROLES') ||
                        member.roles.cache.some(role => role.name === 'BTRFLY Admin');
  
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
```

## 5. Error Handling Improvements

### Added Error Handling Utilities:
```javascript
// New error handling utilities
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
  // Implementation with retry logic
};
```

## 6. Branding Changes

### Updated Discord Embeds:
```javascript
// Original embed color
color: 2201331,

// New BTRFLY blue color
color: 0x0075F2, // BTRFLY blue
```

### Updated Bot Status:
```javascript
// Set bot activity to show BTRFLY KotH status
bot.user.setActivity('BTRFLY KotH | !help', { type: 'PLAYING' });
```

## 7. Match Result Handling

### Added Match Result Logic:
```javascript
// New function to handle match results
const handleMatchResult = (queue, winnerId, loserId, messageChannel) => {
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
  
  // Get the next challenger if available
  if (queue.waitingQueue.length > 0) {
    queue.challenger = queue.waitingQueue.shift();
    queue.matchInProgress = true;
    queue.readyToJoin = true;
    
    // Generate a new lobby password
    queue.lobby.password = randomstring.generate({ length: 3 }).toLowerCase();
    
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
```

## Summary of Changes

1. **Queue Structure**: Changed from two teams of 3 players to a King of the Hill system with a single king, challenger, and waiting queue
2. **Lobby Setup**: Updated to create 1v1 lobbies between the king and challenger
3. **Commands**: Simplified command prefixes and added new commands for the King of the Hill system
4. **Admin Controls**: Added commands for tournament management (skip, clear, add)
5. **Error Handling**: Added robust error handling for DM failures, match result processing, and edge cases
6. **Branding**: Updated all references and colors to BTRFLY branding
7. **Match Flow**: Implemented King of the Hill match flow where winners become/remain king and losers go to the back of the queue
