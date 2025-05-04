const { skipChallenger } = require('../utils/managePlayerQueues')

module.exports = (eventObj, queue) => {
  const channel = eventObj.channel
  
  // Validate that there is a challenger to skip
  if (!queue.challenger) {
    channel.send({
      embed: {
        color: 0x0075F2, // BTRFLY blue
        title: `BTRFLY KotH - Error`,
        description: `There is no current challenger to skip.`
      }
    })
    return
  }
  
  // Process the skip
  skipChallenger(queue, (message) => {
    if (typeof message === 'string') {
      channel.send(message)
    } else {
      channel.send(message)
    }
  })
}
