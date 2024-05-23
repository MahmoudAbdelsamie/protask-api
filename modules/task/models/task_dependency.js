const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Task_dependency = sequelize.define("task_dependencies", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  status: {
    type: Sequelize.ENUM(["Waiting on", "Blocking"]),
    allowNull: false,
  },
});

module.exports = Task_dependency;
