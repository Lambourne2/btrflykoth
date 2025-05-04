const playerNotInQueue = require('../utils/playerNotInQueue')
const playerIdsIndexedToMentions = require('../utils/playerIdsIndexedToMentions')

module.exports = (eventObj, queue) => {
  const { waitingQueue, playerIdsIndexed, currentKing, challenger, lobby, matchInProgress, readyToJoin } = queue
  const channel = eventObj.channel
  const playerId = eventObj.author.id

  // Player is not in the queue
  if (playerNotInQueue({ playerId, channel, queue })) return

  // Build the status message
  let statusDescription = '';
  let fields = [];
  
  // Different status descriptions based on queue state
  if (!currentKing) {
    statusDescription = "No current King. Join the queue to become the first King!";
  } else if (!challenger) {
    statusDescription = `<@${currentKing.id}> is the current King. Join the queue to challenge!`;
  } else {
    statusDescription = `Current match: <@${currentKing.id}> (King) vs <@${challenger.id}> (Challenger)`;
    
    if (waitingQueue.length > 0) {
      statusDescription += `\nNext in line: <@${waitingQueue[0].id}>`;
    }
  }

  // Add fields based on queue state
  fields = [
    { 
      name: 'Current King', 
      value: currentKing ? `<@${currentKing.id}>` : 'None', 
      inline: true 
    },
    { 
      name: 'Current Challenger', 
      value: challenger ? `<@${challenger.id}>` : 'None', 
      inline: true 
    },
    { 
      name: 'Waiting Queue', 
      value: waitingQueue.length > 0 
        ? waitingQueue.map(p => `<@${p.id}>`).join('\n') 
        : 'No players waiting' 
    },
    { 
      name: 'Match in Progress', 
      value: matchInProgress ? 'Yes' : 'No', 
      inline: true 
    },
    { 
      name: 'Lobby Ready', 
      value: readyToJoin ? 'Yes' : 'No', 
      inline: true 
    }
  ];

  // Player is in the queue
  channel.send({
    embed: {
      color: 0x0075F2, // BTRFLY blue
      title: `BTRFLY KotH - Status`,
      description: statusDescription,
      fields: fields,
      footer: {
        text: `Lobby: ${lobby.name}`
      }
    },
  })
}
