const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Task_attach = sequelize.define("task_attachs", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

  name: {
    type: Sequelize.STRING(191),
    allowNull: false,
  },

  extension: {
    type: Sequelize.STRING(191),
    allowNull: false,
  },
});

module.exports = Task_attach;
