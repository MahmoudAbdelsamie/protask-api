"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("workspaces", [
      {
        name: "Mahmoud",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Houda",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Tech",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("workspaces", null, {});
      //
  },
};
