// Update the actions/index.js file to include the new pauseQueue action
const enterQueue = require('./enterQueue')
const leaveQueue = require('./leaveQueue')
const getQueueStatus = require('./getQueueStatus')
const sendCommandList = require('./sendCommandList')
const kickPlayer = require('./kickPlayer')
const winMatch = require('./winMatch')
const skipChallenger = require('./skipChallenger')
const clearQueue = require('./clearQueue')
const addToQueue = require('./addToQueue')
const pauseQueue = require('./pauseQueue')

module.exports = {
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
}
