const Space = require("./space.model");
const UserSpace = require("./user_space.model");
const List = require("../list/list.model");
const Folder = require("../folder/folder.model");
const User = require("../user/user.model");
const { Op, where } = require("sequelize");
const config = require("../../config/middlewares");
const Task = require("../task/models/task");
const Task_attach = require("../task/models/task_attachs");
const Checklist = require("../checklist/checklist.model");
const Tag = require("../task/models/tag");
const Task_tag = require("../task/models/task_tag");
const checklistItems = require("../checklist/checklistItems.model");
const Comment = require("../comment/comment.model");
const comment_attachs = require("../comment/comment_attachs.model");
const mentions = require("../comment/mention.model");
const User_checklist = require("../checklist/user_checklist");
const Mention = require("../comment/mention.model");
const Task_dependency = require("../task/models/task_dependency");
const Subtask = require("../subtask/subtask.model");
const User_subtask = require("../subtask/user_subtask.model");
const Status = require("../task/models/status");
const User_task = require("../task/models/user_task");
const Whiteboard = require("../whiteboard/whiteboard.model");
const Docs = require("../docs/docs.model");

const Users_path = process.env.SERVER_HOST + "/public/images/users/";
let forbidden_msg =
  "space not found or you dont have permission to access this space";

exports.getAllSpaces = (req, res, next) => {
  const userId = req.id;
  User.findByPk(userId, {
    attributes: [],
    include: [
      {
        model: Space,
        attributes: ["id", "name", "color", "Icon"],
        include: [
          {
            model: List,
            required: false,
            attributes: ["id", "name"],
          },
          {
            model: Folder,
            required: false,
            attributes: ["id", "name"],
            include: {
              model: List,
              required: false,
              attributes: ["id", "name"],
            },
          },
        ],
        through: {
          model: UserSpace,
          attributes: [],
        },
      },
    ],
  })
    .then((data) => {
      res.status(200).json({
        status_code: 200,
        data: data.spaces,
        message: "ok",
      });
    })
    .catch((err) => {
      res.status(500).json({
        status_code: 500,
        data: null,
        message: `${err.message}`,
      });
    });
};

exports.getOneSpaceById = async (req, res, next) => {
  let spaceId = req.params.id;
  const userId = req.id;
  try {
    let user = await User.findByPk(userId, {
      attributes: [],
      include: [
        {
          model: Space,
          where: { id: spaceId },
          attributes: ["id", "name", "color", "Icon"],
          include: [
            {
              model: User,
              attributes: [],
              where: {
                id: {
                  [Op.not]: userId,
                },
              },
              required: false,
              attributes: ["id", "name", "email", "avatar"],
              through: {
                attributes: ["user_role"],
                required: false,
              },
            },
          ],
          through: {
            attributes: [],
          },
        },
      ],
      through: {
        model: UserSpace,
        attributes: [],
        required: false,
      },
    });
    if (user != null) {
      await user.dataValues.spaces[0].users.map((user) => {
        user.dataValues.avatar = Users_path + user.dataValues.avatar;
        user.dataValues.user_role =
          user.dataValues.user_spaces.dataValues.user_role;
        if (user.dataValues.user_role) {
          delete user.dataValues.user_spaces.dataValues;
        }
      });
      return res
        .status(200)
        .json({ status_code: 200, data: user.spaces[0], message: "ok" });
    } else {
      throw new Error(forbidden_msg);
    }
  } catch (error) {
    let status = error.message == forbidden_msg ? 403 : 500;
    res.status(status).json({
      status_code: status,
      data: null,
      message: error.message,
    });
  }
};

let userSocket = config.io.getUserSocket();
async function getSocketIdByEmail(email) {
  let test = userSocket.get(email) || null;
  console.log(test);
  return userSocket.get(email) || null;
}

exports.addNewSpace = async (req, res, next) => {
  let io = config.io.getIO();
  const { name, color, Icon, workspace_id, assignees } = req.body;
  try {
    let space = await Space.create({
      name: name,
      color: color,
      Icon: Icon,
      is_favourite: false,
      workspaceId: workspace_id,
    });
    if (space != null) {
      await UserSpace.create({
        user_role: "admin",
        is_owner: true,
        userId: req.id,
        spaceId: space.dataValues.id,
      });

      space.dataValues.lists = [];
      space.dataValues.folders = [];
      space.dataValues.show = false;

      space.dataValues.user_role = "admin";
      let reqSocketId = await getSocketIdByEmail(req.email);
      io.to(reqSocketId).emit("spaceAdd", {
        data: space,
      });
      if (assignees) {
        assignees.map(async (user) => {
          await UserSpace.create({
            user_role: user.role,
            is_owner: 0,
            userId: user.id,
            spaceId: space.dataValues.id,
          });

          space.dataValues.user_role = user.role;

          let socketId = await getSocketIdByEmail(user.email);
          console.log(user.email);
          console.log(socketId, "from space");
          if (socketId != null) {
            io.to(socketId).emit("spaceAdd", {
              data: space,
            });
          }
        });
      }

      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "New Space Added",
      });
    }
  } catch (error) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};


exports.updateOneSpace = async (req, res, next) => {
  const {
    name,
    color,
    Icon,
    is_favourite,
    assignees,
    deleted_assignees,
    updated_assignees,
  } = req.body;
  const io = config.io.getIO();

  try {
    const userId = +req.id;
    const spaceId = +req.params.id;
    const isOwner = await checkIfUserIsadmin(userId, spaceId);

    if (isOwner) {
      const space = await Space.findByPk(spaceId);

      if (space !== null) {
        await addNewAssignees(assignees, space, req);
        await updateAssignees(updated_assignees, space, req);
        await deleteAssignees(deleted_assignees, space, req);

        const updatedValues = {
          name,
          color,
          Icon,
          is_favourite,
        };

        await updateSpace(space, updatedValues, req, io);

        return res.status(200).json({
          status_code: 200,
          data: null,
          message: "Updated",
        });
      } else {
        res.status(500).json({
          status_code: 500,
          data: null,
          message: "Space not found to update!",
        });
      }
    } else {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "You are not authorized to update this space",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};

exports.deleteOneSpace = async (req, res, next) => {
  let io = config.io.getIO();

  const userId = +req.id;
  const spaceId = +req.params.id;
  try {
    let is_owner = await checkIfUserIsadmin(userId, spaceId);
    if (is_owner == true) {
      let space = await Space.findByPk(spaceId);
      if (space != null) {
        let spaceUsers = await config.getSpaceUsers(space.dataValues.id);
        console.log(spaceUsers);
        await space.destroy({});
        console.log(space.dataValues.id);


        await config.sendDataToSpaceUsers(
          spaceUsers,
          io,
          "spaceDelete",
          spaceId,
          getSocketIdByEmail
        );

        return res.status(200).json({
          status_code: 200,
          data: null,
          message: "space deleted",
        });
      } else {
        throw new Error("space not found or is already deleted!");
      }
    } else {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "You are not forbidden to delete this space",
      });
    }
  } catch (errror) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: "space not found to delete or is already deleted!",
    });
  }
};

exports.getSpaceUsers = async (req, res, next) => {
  const listId = req.params.id;

  const listModel = await List.findByPk(listId, {
    attributes: ["id", "name", "listParentType", "listParentId", "createdAt"],
    include: [Space, Folder],
  });

  const spaceId = listModel.commentable?.toJSON().spaceId
    ? listModel.commentable?.toJSON().spaceId
    : listModel.commentable?.toJSON().id;

  await Space.findByPk(spaceId, {
    attributes: [],
    include: [
      {
        model: User,
        required: false,
        attributes: ["id", "name", "email", "avatar"],
        through: {
          attributes: [],
        },
        where: {
          id: {
            [Op.ne]: req.id, // Op.ne stands for "not equal"
          },
        },
      },
    ],
  })
    .then((data) => {
      if (!data) {
        return res
          .status(404)
          .json({ status_code: 404, data: null, message: "Space not found" });
      }
      data.users.map((userObj) => {
        if (userObj.id == req.id) {
          userObj.dataValues.name = "Me";
        }
        userObj.dataValues.avatar = Users_path + userObj.dataValues.avatar;
      });

      res
        .status(200)
        .json({ status_code: 200, data: data.users, message: "ok" });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ status_code: 500, data: null, message: `error: ${error}` });
    });
};

exports.listSpacesByWorkspaceId = async (req, res) => {
  const workspaceId = req.params.id;
  try {
    const spaces = await Space.findAll({
      where: { workspaceId },
      attributes: ["id", "name"],
    });
    return res
      .status(200)
      .json({ status_code: 200, data: spaces, message: "ok" });
  } catch (error) {
    return res
      .status(200)
      .json({ status_code: 200, data: spaces, message: "ok" });
  }
};

exports.getSpceList = async (req, res, next) => {
  const currentSpaceId = +req.query.currentSpaceId;
  const currentWorkspaceId = +req.query.currentWorkspaceId;
  try {
    let spacesModel = await User.findByPk(req.id, {
      attributes: [],
      include: [
        {
          model: Space,
          attributes: ["id", "name"],
          where: {
            id: { [Op.ne]: currentSpaceId },
            workspaceId: currentWorkspaceId,
          },
          through: {
            model: UserSpace,
            attributes: [],
          },
        },
      ],
    });

    res
      .status(200)
      .json({ status_code: 200, data: spacesModel, message: "ok" });
  } catch (err) {
    return res
      .status(500)
      .json({ status_code: 500, data: null, message: err.message });
  }
};

async function notifyForAssign(users, req, space) {
  for (const item of users) {
    console.log(item.dataValues);
    const notification_obj = {
      notificationParentType: "space",
      notificationParentId: space.dataValues.id,
      is_read: false,
      senderId: +req.id,
      type: "assign",
      workspace_id: space.dataValues.workspaceId,
    };
    await config.addNewNotification(item.dataValues.email, notification_obj);
    let socketId = await getSocketIdByEmail(item.dataValues.email);
    console.log(socketId, "from notify");
    if (socketId != null) {
      await sendSocketNotification(
        req,
        socketId,
        `Added new member to space`,
        space.dataValues.name
      );
    }
  }
}

async function sendSocketNotification(req, socketId, message, toName) {
  let io = config.io.getIO();
  await io.to(socketId).emit("notify", {
    message: `${req.name} ${message}  ${toName}`,
    avatar: Users_path + req.avatar,
  });
}

// //////////////////////////////////////////////
const addNewAssignees = async (assignees, space, req) => {
  if (!assignees) return;

  await Promise.all(
    assignees.map(async (user) => {
      const existUser = await UserSpace.findOne({
        where: { userId: user.id, spaceId: space.dataValues.id },
      });

      if (existUser === null) {
        await UserSpace.create({
          user_role: user.role,
          is_owner: 0,
          userId: user.id,
          spaceId: space.dataValues.id,
        });
      }
    })
  );

  const spaceUsers = await config.getSpaceUsers(space.dataValues.id);
  await notifyForAssign(spaceUsers, req, space);
};

const updateAssignees = async (updatedAssignees, space, req) => {
  if (!updatedAssignees) return;

  await Promise.all(
    updatedAssignees.map(async (assignee) => {
      const user = await UserSpace.findOne({
        where: { userId: assignee.id, spaceId: space.dataValues.id },
      });

      if (user !== null) {
        await user.update({ user_role: assignee.role });

        const notificationObj = {
          notificationParentType: "space",
          notificationParentId: space.dataValues.id,
          is_read: false,
          senderId: +req.id,
          type: "role",
          workspace_id: space.dataValues.workspaceId,
        };

        await config.addNewNotification(assignee.email, notificationObj);

        const socketId = await getSocketIdByEmail(assignee.email);
        await sendSocketNotification(
          req,
          socketId,
          `Makes you ${assignee.role} in`,
          space.dataValues.name
        );
      } else {
        throw new Error("User does not exist in this space");
      }
    })
  );
};

const deleteAssignees = async (deletedAssignees, space, req) => {
  if (!deletedAssignees) return;

  await Promise.all(
    deletedAssignees.map(async (assignee) => {
      const delAssignee = await UserSpace.destroy({
        where: { userId: assignee.id, spaceId: space.dataValues.id },
      });

      const notificationObj = {
        notificationParentType: "space",
        notificationParentId: space.dataValues.id,
        is_read: false,
        senderId: +req.id,
        type: "remove",
        workspace_id: space.dataValues.workspaceId,
      };

      await config.addNewNotification(assignee.email, notificationObj);

      const socketId = await getSocketIdByEmail(assignee.email);
      await sendSocketNotification(
        req,
        socketId,
        "Removes you from",
        space.dataValues.name
      );

      if (delAssignee === null) {
        throw new Error(
          `Error while deleting user with id ${assignee.id} from this space`
        );
      }
    })
  );
};

const updateSpace = async (space, updatedValues, req, io) => {
  const updatedSpace = await space.update(updatedValues);

  if (updatedSpace !== null) {
    const spaceUsers = await config.getSpaceUsers(updatedSpace.dataValues.id);
    const newSpaceModel = await config.getSpaceModelById(
      updatedSpace.dataValues.id
    );
    console.log(spaceUsers);

    await config.sendDataToSpaceUsers(
      spaceUsers,
      io,
      "spaceEdit",
      newSpaceModel,
      getSocketIdByEmail
    );
  } else {
    throw new Error("Internal error while updating space");
  }
};

