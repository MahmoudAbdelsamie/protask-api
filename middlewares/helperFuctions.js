const Space = require("../modules/space/space.model");
const User = require("../modules/user/user.model");
const UserWorkspace = require("../modules/workspace/user_workspace.model");
const Workspace = require("../modules/workspace/workspace.model");
const socket = require("./socket");
const user_spaces = require("../modules/space/user_space.model");
const Status = require("../modules/task/models/status");
const Task = require("../modules/task/models/task");
const Tag = require("../modules/task/models/tag");
const Subtask = require("../modules/subtask/subtask.model");
const Task_attach = require("../modules/task/models/task_attachs");
const { Op, Sequelize, literal } = require("sequelize");

const fs = require("fs");
// const { Op, Sequelize } = require("sequelize");

exports.handleAvatar = (mainKey, attribute, oldAttribute, path, type = "") => {
  let x = attribute;
  mainKey.map((item) => {
    if (item.dataValues.extension == "pdf") {
      path = process.env.SERVER_HOST + `/public/files/${type}/`;
    }
    item.dataValues[x] = path + item.dataValues[oldAttribute];
  });
};

exports.getCurrentFormattedDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate;
};

exports.handleDateForamat = (formattedDate) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  formattedDate = formattedDate
    .toLocaleString("en-US", options)
    .replace(",", "");
  return formattedDate;
};
exports.generateRandomString = () => {
  return Math.floor(Math.random() * Date.now()).toString(36);
};

exports.findNotifDate = (date_notified) => {
  /**
   * @ findNotifDate : Finds the Date Difference of a Notification
   * @ date_notified : The notification date
   **/
  const date_sent_tmp = new Date(date_notified);

  var date_sent = date_sent_tmp.getTime();
  const date_now = new Date();
  //current timestamp
  var today = date_now.getTime();

  //Subtract the timestamps
  var calc = new Date(today - date_sent);

  //Prevent Extra 1 Hour
  calc.setHours(calc.getUTCHours() + 0);

  //Make our result readable
  var calcDate =
    calc.getDate() + "-" + (calc.getMonth() + 1) + "-" + calc.getFullYear();
  var calcTime =
    calc.getHours() + ":" + calc.getMinutes() + ":" + calc.getSeconds();

  //Get How many days, months and years that has passed
  var date_passed = calcDate.split("-");
  var time_passed = calcTime.split(":");

  if (!date_passed.includes("1-1-1970")) {
    var days_passed =
      parseInt(date_passed[0]) - 1 != 0 ? parseInt(date_passed[0]) - 1 : null;
    var months_passed =
      parseInt(date_passed[1]) - 1 != 0 ? parseInt(date_passed[1]) - 1 : null;
    var years_passed =
      parseInt(date_passed[2]) - 1970 != 0
        ? parseInt(date_passed[2]) - 1970
        : null;
  } else {
    var days_passed = null;
    var months_passed = null;
    var years_passed = null;
  }

  var hours_passed = parseInt(time_passed[0]);
  var mins_passed = parseInt(time_passed[1]);
  var secs_passed = parseInt(time_passed[2]);

  //Set up your Custom Text output here
  const s = ["sec ago", "secs ago"]; //seconds
  const m = ["min", "sec ago", "mins", "secs ago"]; //minutes
  const h = ["hr", "min ago", "hrs", "mins ago"]; //hours
  const d = ["day", "hr ago", "days", "hrs ago"]; //days
  const M = ["month", "day ago", "months", "days ago"]; //months
  const y = ["year", "month ago", "years", "months ago"]; //years

  var ret, retA, retB;

  if (
    !days_passed &&
    !months_passed &&
    !years_passed &&
    !hours_passed &&
    !mins_passed
  ) {
    ret =
      secs_passed == 1 ? secs_passed + " " + s[0] : secs_passed + " " + s[1];
  } else if (!days_passed && !months_passed && !years_passed && !hours_passed) {
    retA =
      mins_passed == 1 ? mins_passed + " " + m[0] : mins_passed + " " + m[2];
    retB =
      secs_passed == 1 ? secs_passed + " " + m[1] : secs_passed + " " + m[3];

    ret = retA + " " + retB;
  } else if (!days_passed && !months_passed && !years_passed) {
    retA =
      hours_passed == 1 ? hours_passed + " " + h[0] : hours_passed + " " + h[2];
    retB =
      mins_passed == 1 ? mins_passed + " " + h[1] : mins_passed + " " + h[3];

    ret = retA + " " + retB;
  } else if (!years_passed && !months_passed) {
    retA =
      days_passed == 1 ? days_passed + " " + d[0] : days_passed + " " + d[2];
    retB =
      hours_passed == 1 ? hours_passed + " " + d[1] : hours_passed + " " + d[3];

    ret = retA + " " + retB;
  } else if (!years_passed) {
    retA =
      months_passed == 1
        ? months_passed + " " + M[0]
        : months_passed + " " + M[2];
    retB =
      days_passed == 1 ? days_passed + " " + M[1] : days_passed + " " + M[3];

    ret = retA + " " + retB;
  } else {
    retA =
      years_passed == 1 ? years_passed + " " + y[0] : years_passed + " " + y[2];
    retB =
      months_passed == 1
        ? months_passed + " " + y[1]
        : months_passed + " " + y[3];

    ret = retA + " " + retB;
  }

  //Check if return contains a negative value
  if (ret.includes("-")) {
    ret += " ( TIME ERROR )-> Invalid Date Provided!";
  }

  return ret;
};

exports.addNewNotification = async (email, notification_obj) => {
  const {
    notificationParentType,
    notificationParentId,
    is_read,
    senderId,
    type,
    workspace_id,
  } = notification_obj;
  let user_obj = await User.findOne({
    where: {
      email: email,
    },
  });
  if (user_obj != null) {
    // if users is exist
    await Notification.create({
      notificationParentType,
      notificationParentId,
      is_read,
      senderId,
      recieverId: user_obj.id,
      workspace_id,
      type,
    });
  }
};

exports.findWorkspaces = async (userId, is_active) => {
  let whereClause = {};
  if (is_active == true) {
    whereClause["is_active"] = true;
  } else {
    whereClause = {};
  }
  let workspaces = await User.findByPk(userId, {
    attributes: [],
    order: [[Workspace, UserWorkspace, "is_active", "DESC"]],
    include: [
      {
        model: Workspace,
        attributes: ["id", "name", "avatar"],
        through: {
          model: UserWorkspace,
          attributes: [],
          // order: [["is_active", "DESC"]],
          where: whereClause,
          // required: false,
        },
      },
    ],
  });
  if (workspaces) {
    workspaces.dataValues.workspaces.map((workspace) => {
      let imagesEx = [".png", ".jpeg", ".jpg", ".webp", ".svg", ".gif"];
      imagesEx.map((ex) => {
        if (workspace.dataValues.avatar.includes(ex)) {
          workspace.dataValues.avatar =
            workspace_path + workspace.dataValues.avatar;
        }
      });
    });
    return workspaces;
  } else {
    throw new Error("no workspace are found");
  }
};

exports.removeSocketId = (socketId, userSocket) => {
  for (const [email, socketIds] of userSocket.entries()) {
    const index = socketIds.indexOf(socketId);
    if (index !== -1) {
      socketIds.splice(index, 1);
      console.log("from remove", email, socketIds, userSocket);
    }
    if (socketIds.length == 0) {
      userSocket.delete(email);
    }
  }
};

exports.getSpaceUsers = async (id) => {
  const spaceUsers = await Space.findByPk(id, {
    attributes: [],
    include: [
      {
        model: User,
        required: false,
        attributes: ["id", "name", "email", "avatar"],
        through: {
          attributes: ["user_role"],
          model: user_spaces,
        },
      },
    ],
  });

  return spaceUsers.users;
};

exports.getSpaceModelById = async (id) => {
  let spaceModel = await Space.findByPk(id, {
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
  });

  spaceModel.dataValues.show = false;

  spaceModel.dataValues.folders?.map((folder) => {
    folder.dataValues.showF = false;

    folder.dataValues.lists?.map((list) => {
      list.dataValues.showFL = false;
    });
  });

  spaceModel.dataValues.lists?.map((list) => {
    list.dataValues.showL = false;
  });
  return spaceModel;
};


exports.getAllstatusWithTasks = async (listId, order) => {
  const result = await Status.findAll({
    attributes: ["id", "name", "color"],
    include: [
      {
        model: Task,
        attributes: [
          "id",
          "title",
          "start_date",
          "end_date",
          "description",
          "periority",
          "createdAt",
          "order",
        ],
        required: false,
        where: { listId: listId },
        order: [["order", "ASC"]],
        include: [
          {
            model: Tag,
            attributes: ["id", "name", "color"],
            through: { attributes: [] },
          },
          {
            model: Status,
            reuired: false,
            attributes: ["id", "name", "color", "category"],
          },
          {
            model: User,
            reuired: false,
            attributes: ["id", "avatar", "name"],
            through: {
              attributes: [],
            },
          },
          {
            model: Subtask,
            as: "subtasks",
            attributes: ["id", "title", "start_date", "end_date", "periority"],
          },

          {
            model: Task_attach,
            reuired: false,
            attributes: ["id", "name", "extension"],
          },
        ],
      },
    ],
    order: [literal(`FIELD(statuses.id,${order.join(",")})`)],
    where: { listId: { [Op.or]: [listId, { [Op.is]: null }] } },
  });

  return result;
};

exports.sendDataToSpaceUsers = async (
  spaceUsers,
  io,
  channelName,
  data,
  getSocket
) => {
  //  console.log("typeof data" , typeof data);
  for (const item of spaceUsers) {
    // console.log(item.dataValues.user_spaces);
    if (typeof data == "object") {
      data.dataValues.user_role =
        item.dataValues.user_spaces.dataValues.user_role;
    }
    console.log(
      "testedit",
      item.dataValues.id,
      item.dataValues.user_spaces.dataValues.user_role
    );
    // console.log("dataspace" , data.dataValues.user_role);
    let socketId = await getSocket(item.dataValues.email);
    // console.log(socketId, "from space");
    if (socketId != null) {
      await io.to(socketId).emit(channelName, {
        data: data,
      });
    }
  }
};


exports.formatDate = (dateToFormat) => {
  let newDate = new Date(dateToFormat);
  return newDate.toLocaleDateString("en-US");
};

exports.isAdminOrOwner = async (userId, workspaceId) => {
  try {
    let user_workspace = await UserWorkspace.findOne({
      where: {
        userId: userId,
        workspaceId: workspaceId,
        is_owner: true,
      },
    });
    if (user_workspace != null) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateNotification = async (email, notification_obj) => {
  const {
    notificationParentType,
    notificationParentId,
    senderId,
    type,
    workspace_id,
    invitationId,
  } = notification_obj;
  let user_obj = await User.findOne({
    where: {
      email: email,
    },
  });
  if (user_obj != null) {
    // if users is exist
    let invite_notification = await Notification.findOne({
      where: {
        notificationParentId: invitationId,
      },
    });
    if (invite_notification != null)
      await invite_notification.update({
        notificationParentType: notificationParentType,
        notificationParentId,
        is_read: 1,
        senderId,
        recieverId: user_obj.id,
        workspace_id,
        type,
      });
  }
};
