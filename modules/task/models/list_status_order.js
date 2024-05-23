const Sequelize = require("sequelize");
const sequelize = require("../../../config/database");

const listStatusOrder = sequelize.define("list-status-orders", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  statusOrder: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
});

module.exports = listStatusOrder;
