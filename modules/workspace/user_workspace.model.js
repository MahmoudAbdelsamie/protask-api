const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const UserWorkspace = sequelize.define("user_workspaces", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  user_role: {
    type: Sequelize.ENUM("admin", "member"),
    allowNull: false,
    defaultvalue: "member",
  },
  is_owner: {
    type: Sequelize.BOOLEAN,
    defaultvalue: false,
    allowNull: false,
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultvalue: false,
    allowNull: false,
  },
});

module.exports = UserWorkspace;
