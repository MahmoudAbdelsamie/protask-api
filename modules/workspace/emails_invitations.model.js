const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const Invite = sequelize.define("invites", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  email: {
    type: Sequelize.STRING(191),
    allowNull: false,
  },
  role: {
    type: Sequelize.ENUM("admin", "member"),
    allowNull: false,
    defaultvalue: "member",
  },
  hash: {
    type: Sequelize.STRING(191),
    allowNull: false,
  },
  workspace_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  expire_date: {
    type: Sequelize.STRING(191),
    allowNull: false,
  },
 status : {
  type: Sequelize.ENUM("pending" , "accepted" , "declined" , "expired"),
  defaultvalue: "pending",
  allowNull: false,
 },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultvalue: false,
    allowNull: false,
  },
});

module.exports = Invite;
