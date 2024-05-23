const task = require("../models/task");
const { Op, Sequelize, literal } = require("sequelize");
const config = require("../../../config/middlewares");
const Task = require("../models/task");
const User = require("../../user/user.model");
const listStatusOrder = require("../models/list_status_order");
const Tag = require("../models/tag");
const Subtask = require("../../subtask/subtask.model");
const Task_attach = require("../models/task_attachs");
// const users_path = // path_to_it
// const task_img_path = path_to_it

let userSocket = config.io.getUserSocket();
async function getSocketIdByEmail(email) {
  let test = userSocket.get(email) || null;
  console.log(test);
  return userSocket.get(email) || null;
}

exports.createNewStatus = async (req, res, next) => {
  let io = config.io.getIO();
  try {
    let rondomClor = Math.floor(Math.random() * 16777215).toString(16);
    const { name, color, category, list_id } = req.body;
    let new_status = await Status.create({
      name: name,
      color: color ? color : "#" + rondomClor,
      category: category,
      listId: list_id,
    });

    const [instance, created] = await listStatusOrder.findOrCreate({
      where: { listId: list_id },
      defaults: {
        statusOrder: JSON.stringify([new_status.id]),
        listId: list_id,
      },
    });

    if (!created) {
      await instance.update({
        statusOrder: Sequelize.literal(
          `JSON_ARRAY_APPEND(statusOrder, '$', ${new_status.id})`
        ),
      });
    }

    let statusData = {
      id: new_status.dataValues.id,
      name: new_status.dataValues.name,
      color: new_status.dataValues.color,
      tasks: [],
    };

    let listUsers = await getUsersForList(list_id);
    await config.sendStatusEventsToUsers(
      listUsers,
      io,
      "statusAdd",
      statusData,
      getSocketIdByEmail
    );

    return res.status(200).json({
      status_code: 200,
      message: "Status created successfully",
      data: null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ status_code: 500, message: err.message, data: null });
  }
};

exports.updateStatus = async (req, res, next) => {
  let io = config.io.getIO();
  const { name, color, index } = req.body;
  try {
    let statusModel = await Status.findByPk(req.params.id);
    if (!statusModel) {
      throw new Error(`Status not found`);
    }

    const updatedModel = await statusModel.update({
      name: name,
      color: color,
    });

    let listUsers = await getUsersForList(statusModel.listId);
    await config.sendStatusEventsToUsers(
      listUsers,
      io,
      "statusEdit",
      { statusIndex: index, updatedData: updatedModel },
      getSocketIdByEmail
    );

    return res.status(200).json({
      status_code: 200,
      msg: "Status updated successfully",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status_code: 500,
      msg: "Status not found to update!",
      data: null,
    });
  }
};

exports.orderStatus = async (req, res, next) => {
  const { newOrder, listId } = req.body;
  let listUsers = await getUsersForList(listId);
  let io = config.io.getIO();
  try {
    await listStatusOrder.update(
      { statusOrder: JSON.stringify(newOrder) },
      { where: { listId } }
    );

    const updatedData = await config.getAllstatusWithTasks(listId, [
      1,
      2,
      ...newOrder,
      3,
    ]);

    for (const item of updatedData) {
      for (const task of item.dataValues.tasks) {
        config.handelAvatar(
          task.dataValues.users,
          "avatar",
          "avatar",
          users_path
        );
        task.dataValues.subtasks = task.dataValues.subtasks.length;


        config.handleAvatar(
          task.dataValues.task_attachs,
          "path",
          "name",
          task_img_path,
          "tasks"
        );
        let firstImage = task.dataValues.task_attachs.find((file) =>
          ["jpg", "jpeg", "png"].includes(file.extension.toLowerCase())
        );

        task.dataValues.coverImage = firstImage
          ? firstImage?.dataValues.path
          : null;
        task.dataValues.attachments = task.dataValues.task_attachs.length;
        delete task.dataValues.task_attachs;
        task.dataValues.start_date =
          task.dataValues.start_date == null
            ? task.dataValues.start_date
            : config.handleDateForamat(task.dataValues.start_date);
        task.dataValues.end_date =
          task.dataValues.end_date == null
            ? task.dataValues.end_date
            : config.handleDateForamat(task.dataValues.end_date);
      }
    }

    await config.sendStatusEventsToUsers(
      listUsers,
      io,
      "statusOrder",
      updatedData,
      getSocketIdByEmail
    );

    res.status(200).json({
      status_code: 200,
      message: "Status updated successfully",
      data: null,
    });
  } catch (e) {
    res.status(500).json({
      status_code: 500,
      message: e.message,
      data: null,
    });
  }
};

// get all tags
exports.getAllStatusbyListId = async (req, res, next) => {
  let order = await listStatusOrder.findOne({
    atrributes: ["statusOrder"],
    where: { listId: req.params.id },
  });

  let statusOrder = order
    ? [1, 2, ...JSON.parse(order.statusOrder), 3]
    : [1, 2, 3];
  await Status.findAll({
    attributes: ["id", "name", "color"],
    order: [literal(`FIELD(statuses.id,${statusOrder.join(",")})`)],
    where: { listId: { [Op.or]: [req.params.id, { [Op.is]: null }] } },
  })
    .then((status) => {
      res.status(200).json({ status_code: 200, message: "", data: status });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status_code: 500, message: err.message, data: null });
    });
};

exports.deleteStatus = async (req, res, next) => {
  try {
    const statusToDelete = await Status.findByPk(req.params.id);
    if (!statusToDelete) {
      return res
        .status(404)
        .json({ status_code: 404, message: "Status Not Found", data: null });
    }

    let listUsers = await getUsersForList(statusToDelete.listId);
    let io = config.io.getIO();

    const newStatus = await Status.findOne({
      where: { name: "to do" },
    });

    if (!newStatus) {
      return res.status(404).json({
        status_code: 404,
        message: "New Status Not Found",
        data: null,
      });
    }

    await task.update(
      { statusId: newStatus.id },
      { where: { statusId: statusToDelete.id } }
    );

    await statusToDelete.destroy();

    let UpdatedStatus = await config.getstatusModelWithTasks(
      newStatus.id,
      statusToDelete.listId
    );

    for (const task of UpdatedStatus.dataValues.tasks) {
      config.handleAvatar(
        task.dataValues.users,
        "avatar",
        "avatar",
        users_path
      );
      task.dataValues.subtasks = task.dataValues.subtasks.length;


      config.handleAvatar(
        task.dataValues.task_attachs,
        "path",
        "name",
        task_img_path,
        "tasks"
      );
      let firstImage = task.dataValues.task_attachs.find((file) =>
        ["jpg", "jpeg", "png"].includes(file.extension.toLowerCase())
      );

      task.dataValues.coverImage = firstImage
        ? firstImage?.dataValues.path
        : null;
      task.dataValues.attachments = task.dataValues.task_attachs.length;
      delete task.dataValues.task_attachs;
      task.dataValues.start_date =
        task.dataValues.start_date == null
          ? task.dataValues.start_date
          : config.handleDateForamat(task.dataValues.start_date);
      task.dataValues.end_date =
        task.dataValues.end_date == null
          ? task.dataValues.end_date
          : config.handleDateForamat(task.dataValues.end_date);
    }

    await config.sendStatusEventsToUsers(
      listUsers,
      io,
      "statusTasksEdit",
      {
        statusIndex: 0,
        newStatusData: UpdatedStatus,
      },
      getSocketIdByEmail
    );

    await config.sendStatusEventsToUsers(
      listUsers,
      io,
      "statusDelete",
      req.query.index,
      getSocketIdByEmail
    );


    await listStatusOrder.update(
      {
        statusOrder: Sequelize.literal(
          `JSON_REMOVE(statusOrder, '$[${req.query.index - 2}]')`
        ),
      },
      {
        where: { listId: statusToDelete.listId },
      }
    );

    return res.status(200).json({
      status_code: 200,
      message: "Status Deleted successfully",
      data: null,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status_code: 500, message: error.message, data: null });
  }
};


async function getUsersForList(id) {
  const usersForList = await User.findAll({
    attributes: ["email"],
    include: [
      {
        model: Task,
        where: { listId: id },
        attributes: [],
      },
    ],
    distinct: true,
  });
  console.log("users list ", usersForList.length, usersForList);
  return usersForList;
}
