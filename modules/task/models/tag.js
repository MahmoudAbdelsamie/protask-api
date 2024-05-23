const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const Tag = sequelize.define(
  "tags",
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

    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    deletedAt: "deletedAt",
    // indexes: [{ unique: true, fields: ["name"] }],
  }
);

module.exports = Tag;
