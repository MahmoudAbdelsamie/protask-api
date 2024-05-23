"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("user_workspaces", [
      {
        user_role: "admin",
        is_owner: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        workspaceId: 1,
      },
      {
        user_role: "admin",
        is_owner: true,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        workspaceId: 2,
      },
      {
        user_role: "admin",
        is_owner: true,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 6,
        workspaceId: 1,
      },
      {
        user_role: "admin",
        is_owner: true,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 6,
        workspaceId: 3,
      },
      {
        user_role: "admin",
        is_owner: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 32,
        workspaceId: 2,
      },
      {
        user_role: "admin",
        is_owner: false,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 31,
        workspaceId: 3,
      },
      {
        user_role: "admin",
        is_owner: false,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 31,
        workspaceId: 1,
      },
      {
        user_role: "admin",
        is_owner: false,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 32,
        workspaceId: 1,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("user_workspaces", null, {});
  },
};
