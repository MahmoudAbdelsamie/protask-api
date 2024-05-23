const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Task_tag = sequelize.define("task_tags", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
});

module.exports = Task_tag;
