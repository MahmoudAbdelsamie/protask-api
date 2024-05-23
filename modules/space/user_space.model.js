const Sequelize = require("sequelize");
const sequelize = require("../../config/database");

const UserSpace = sequelize.define("user_spaces", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  user_role: {
    type: Sequelize.ENUM("admin", "member", "guest"),
    allowNull: false,
    defaultvalue: "member",
  },
  is_owner: {
    type: Sequelize.BOOLEAN,
    defaultvalue: false,
    allowNull: false,
  },
});

module.exports = UserSpace;
