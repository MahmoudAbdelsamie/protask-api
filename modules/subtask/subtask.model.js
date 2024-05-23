const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Subtask = sequelize.define(
  "subtasks",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    start_date: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    end_date: {
      type: Sequelize.STRING(191),
      allowNull: true,
      defaultvalue: null,
    },
    periority: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

module.exports = Subtask;
