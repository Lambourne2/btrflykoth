const { clearQueue } = require('../utils/managePlayerQueues')

module.exports = (eventObj, queue) => {
  const channel = eventObj.channel
  
  // Process the clear queue command
  clearQueue(queue, (message) => {
    if (typeof message === 'string') {
      channel.send(message)
    } else {
      channel.send(message)
    }
  })
}
