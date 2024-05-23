const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Status = sequelize.define(
  "statuses",
  {
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

    color: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    category: {
      type: Sequelize.ENUM("active", "done", "closed"),
      allowNull: false,
      defaultValue: "active",
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

module.exports = Status;
