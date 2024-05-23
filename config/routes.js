const userRoute = require("../modules/user/user.route");
const loginRoute = require("../modules/login/login.route");
const spaceRoute = require("../modules/space/space.route");
const tagRoute = require("../modules/task/routes/tagRoutes");
const statusRoute = require("../modules/task/routes/statusRoute");
const taskRoute = require("../modules/task/routes/taskRoute");
const subtaskRoute = require("../modules/subtask/subtask.route");
const workspaceRoute = require("../modules/workspace/workspace.route");

module.exports = {
  userRoute,
  loginRoute,
  spaceRoute,
  tagRoute,
  taskRoute,
  subtaskRoute,
  workspaceRoute,
  statusRoute
};
