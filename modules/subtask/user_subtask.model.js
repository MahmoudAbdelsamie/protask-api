const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const User_subtask = sequelize.define("user_subtasks", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

});

module.exports = User_subtask;
