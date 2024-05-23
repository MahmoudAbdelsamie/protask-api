const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Workspace = sequelize.define(
  "workspaces",
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
    avatar: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    employee: {
      type: Sequelize.STRING(191),
      allowNull: false,
      defaultValue: "2-5",
    },
    industry: {
      type: Sequelize.STRING(191),
      allowNull: false,
      defaultValue: "IT",
    },
    owner_role: {
      type: Sequelize.STRING(191),
      allowNull: false,
      defaultValue: "Team Leader",
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

module.exports = Workspace;
