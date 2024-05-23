const mwError = require("../middlewares/validationMW");
const auth = require("../middlewares/authMW");
const {
  handleAvatar,
  handleDateForamat,
  generateRandomString,
  addNewNotification,
  findWorkspaces,
  removeSocketId,
  findNotifDate,
  getCurrentFormattedDate,
  getSpaceUsers,
  getSpaceModelById,
  sendDataToSpaceUsers,
  getAllstatusWithTasks,
  isAdminOrOwner,
  updateNotification,
} = require("../middlewares/helperFuctions");
const io = require("../middlewares/socket");
const myCache = require("../middlewares/node-cache");
module.exports = {
  handleAvatar,
  handleDateForamat,
  getCurrentFormattedDate,
  generateRandomString,
  addNewNotification,
  findWorkspaces,
  removeSocketId,
  findNotifDate,
  getSpaceUsers,
  getSpaceModelById,
  sendDataToSpaceUsers,
  getAllstatusWithTasks,
  isAdminOrOwner,
  updateNotification,
};
