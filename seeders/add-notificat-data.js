"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("notifications", [
      {
        notificationParentType: "invite",
        notificationParentId: 1,
        is_read: 0,
        senderId: 39,
        recieverId: 31,
        type: "invite",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 5,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "create",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 6,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "create",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 6,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "assign",
        createdAt: new Date(),
        updatedAt: new Date(),
    
      },
      {
        notificationParentType: "task",
        notificationParentId: 6,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "create",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 6,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "comment",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 5,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 31,
        type: "mention",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 6,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 32,
        type: "mention",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        notificationParentType: "task",
        notificationParentId: 5,
        is_read: 0,
        workspaceId: 5,
        senderId: 39,
        recieverId: 32,
        type: "mention",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
     
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("notifications", null, {});
  },
};
