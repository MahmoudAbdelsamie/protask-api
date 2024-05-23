const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Task = sequelize.define(
  "tasks",
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
    //   long text
    description: {
      type: Sequelize.TEXT("long"),
      defaultvalue: " ",
      allowNull: false,
    },
    periority: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    is_favourite: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: true,
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

module.exports = Task;
