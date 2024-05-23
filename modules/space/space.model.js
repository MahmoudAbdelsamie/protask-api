const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Space = sequelize.define(
  "spaces",
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
    Icon: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    is_favourite: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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

module.exports = Space;
