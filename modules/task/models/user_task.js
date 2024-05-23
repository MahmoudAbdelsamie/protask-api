const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const User_task = sequelize.define("user_tasks", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = User_task;
