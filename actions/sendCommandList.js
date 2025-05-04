// Update the sendCommandList.js file to include the new aliases and pause command
const { commandToString } = require('../utils/commands')

module.exports = (eventObj) => {
  const channel = eventObj.channel

  channel.send({
    embed: {
      color: 0x0075F2, // BTRFLY blue
      title: 'BTRFLY KotH - Command List',
      description: 'Here are all the available commands:',
      fields: [
        {
          name: 'Queue Commands',
          value: `${commandToString.queue} - Join the queue (aliases: ${commandToString.q}, ${commandToString.join}, ${commandToString.j})\n${commandToString.leave} - Leave the queue (alias: ${commandToString.l})\n${commandToString.status} - Check the current queue status`,
        },
        {
          name: 'Match Commands',
          value: `${commandToString.win} @user - Report that you won against the mentioned player`,
        },
        {
          name: 'Admin Commands',
          value: `${commandToString.kick} @user - Kick a player from the queue\n${commandToString.skip} - Skip the current challenger\n${commandToString.clear} - Clear the entire queue\n${commandToString.add} @user - Add a user to the queue\n${commandToString.pause} - Pause/resume the queue`,
        },
        {
          name: 'Help',
          value: `${commandToString.help} - Show this command list`,
        },
      ],
      footer: {
        text: 'BTRFLY Tournaments - King of the Hill'
      }
    },
  })
}
