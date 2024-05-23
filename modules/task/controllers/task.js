const Task = require("../models/task");
const Task_tag = require("../models/task_tag");
const Task_attach = require("../models/task_attachs");
const imgMw = require("../../../middlewares/imageMW");
const Subtask = require("../../subtask/subtask.model");
const User_subtask = require("../../subtask/user_subtask.model");
const User_task = require("../models/user_task");
const User_checklist = require("../../checklist/user_checklist");
const Task_dependency = require("../models/task_dependency");
const Tag = require("../models/tag");
const Status = require("../models/status");
const { Sequelize, literal, json } = require("sequelize");
const Op = require("sequelize").Op;
const User = require("../../user/user.model");
// const users_path = 
// const task_img_path = 
const config = require("../../../config/middlewares");

let userSocket = config.io.getUserSocket();
async function getSocketIdByEmail(email) {
  let test = userSocket.get(email) || null;
  console.log(test);
  return userSocket.get(email) || null;
}

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
  return usersForList;
}
const addNewStatus = async (new_statuses, status_name, listId) => {
  try {
    let io = config.io.getIO();
    let listUsers = await getUsersForList(listId);

    const [instance, created] = await listStatusOrder.findOrCreate({
      where: { listId },
      defaults: {
        statusOrder: JSON.stringify([]),
        listId,
      },
    });
    const statusIds = await Promise.all(
      new_statuses.map(async (status_obj) => {
        const new_status = await Status.create({
          name: status_obj.name,
          color: status_obj.color,
          category: "active",
          listId: listId,
        });

        let statusData = {
          id: new_status.dataValues.id,
          name: new_status.dataValues.name,
          color: new_status.dataValues.color,
          tasks: [],
        };

        await config.sendStatusEventsToUsers(
          listUsers,
          io,
          "statusAdd",
          statusData,
          getSocketIdByEmail
        );

        await instance.update({
          statusOrder: Sequelize.literal(
            `JSON_ARRAY_APPEND(statusOrder, '$', ${new_status.id})`
          ),
        });

        if (new_status != null && new_status.dataValues.name == status_name) {
          return new_status.dataValues.id;
        }
        return null;
      })
    );

    if (status_name == null) {
      return null;
    } else {
      const new_status_id = statusIds.find((id) => id !== null);
      if (new_status_id !== undefined) {
        return new_status_id;
      } else {
        throw new Error("No matching status found");
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};


const createTaskTags = async (tagId, taskId) => {
  try {
    await Task_tag.create({
      tagId,
      taskId: taskId,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};


const createTag = async (name, color, userId, workspace_id) => {
  try {
    let new_tag = await Tag.create({
      name,
      color: color,
      userId,
      workspaceId: workspace_id,
    });
    if (new_tag != null) {
      return new_tag;
    } else return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addNewTask = async (req, res, next) => {
  const {
    title,
    start_date,
    end_date,
    description,
    periority,
    listId,
    tagId,
    attatchments,
    subtasks,
    assignees,
    checklists,
    dependencies,
    new_entry_tags,
    filesnames,
    new_statuses,
    workspace_id,
  } = req.body;

  try {
    let status_name = req.body.status_name ? req.body.status_name : null;
    let new_status_id = new_statuses
      ? await addNewStatus(new_statuses, status_name, listId)
      : 1;
    new_status_id = new_status_id != null ? new_status_id : 1;
    let statusId = req.body.statusId ? req.body.statusId : new_status_id;
    const maxOrder =
      (await Task.max("order", {
        where: { listId, statusId },
        col: "order",
        plain: true,
      })) || 0;
    let task = await Task.create({
      title: title,
      start_date: start_date ? start_date : config.getCurrentFormattedDate(),
      end_date: end_date ? end_date : null,
      description: description ? description : " ",
      periority: periority ? periority : "low",
      listId: listId,
      statusId: statusId != undefined ? statusId : 1,
      is_favourite: false,
      order: maxOrder + 1,
      userID: req.id,
    });
    if (task != null) {
      User_task.create({
        userId: req.id,
        taskId: task.id,
      });

      if (new_entry_tags) {
        let new_tags;
        new_entry_tags.map(async (tag_obj) => {
          new_tags = await createTag(
            tag_obj.name,
            tag_obj.color,
            +req.id,
            workspace_id
          );
          if (new_tags != null) {
            await createTaskTags(new_tags.id, task.id);
          }
        });
      }
      if (tagId) {
        for (let i = 0; i <= tagId.length - 1; i++) {
          await createTaskTags(tagId[i], task.id);
        }
      }
      if (attatchments != undefined) {
        let task_attachs = imgMw.uploadFilesAndPdf(
          attatchments,
          filesnames,
          "tasks"
        );
        task_attachs.map(async (attachment_obj) => {
          await Task_attach.create({
            taskId: task.id,
            name: attachment_obj.fileName,
            extension: attachment_obj.extension,
          });
        });
      }
      if (subtasks) {
        let new_subtask;
        subtasks.map(async (subtask) => {
          new_subtask = await Subtask.create({
            title: subtask.title,
            start_date: subtask.start_date
              ? subtask.start_date
              : config.getCurrentFormattedDate(),
            end_date: subtask.end_date ? subtask.end_date : null,
            periority: subtask.periority ? subtask.periority : "low",
            taskId: task.id,
            statusId: subtask.subtask_status_id ? subtask.subtask_status_id : 1,
          });
          if (new_subtask != null) {
            if (subtask.assignees && new_subtask) {
              subtask.assignees.map((userId) => {
                User_subtask.create({
                  userId: userId,
                  subtaskId: new_subtask.id,
                });
              });
            }
          }
        });
      }
  
      if (assignees) {
        
        assignees.map((userId) => {
          User_task.create({
            userId: userId,
            taskId: task.id,
          });
        });
      }
    
      if (checklists) {
        await checklists.map(async (checklist) => {
          let new_checklist = await Checklist.create({
            title: checklist.title,
            checklistParentType: "task",
            checklistParentId: task.id,
            userId: +req.id,
          });
          let new_checklist_id = new_checklist.dataValues.id;
        
          if (checklist.items) {
            checklist.items.map(async (item) => {

              let newChecklistItems = await ChecklistItems.create({
                title: item.title,
                is_completed: false,
                checklistId: new_checklist_id,
              });
              let list_item_id = newChecklistItems.dataValues.id;
              if (item.assignees) {
                item.assignees.map((assignee) => {
                  User_checklist.create({
                    userId: +assignee,
                    checklistItemId: list_item_id,
                  });
                });
              }
            });
          }
        });
      }
      if (dependencies) {
        dependencies.map((dependency) => {
          dependency.dependencies_tasks.map((tasks_ids) => {
            Task_dependency.create({
              status: dependency.status,
              taskId: task.id, 
              dependencyId: tasks_ids, 
            });
          });
        });
      }
      res.status(200).json({
        status_code: 200,
        data: null,
        msg: "task created sucessfully",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const TaskId = req.params.id;
    const task = await Task.findByPk(TaskId, {
      attributes: [
        "id",
        "title",
        "start_date",
        "end_date",
        "description",
        "periority",
        "listId",
        "is_favourite",
      ],
      include: [
        {
          model: Status,
          reuired: false,
          attributes: ["id", "name", "color", "category"],
        },
        {
          model: User,
          reuired: false,
          attributes: ["id", "avatar", "name", "email"],
          through: {
            attributes: [],
          },
        },
        {
          model: Tag,
          reuired: false,
          attributes: ["id", "name", "color"],
          through: {
            attributes: [],
          },
        },
        {
          model: Subtask,
          as: "subtasks",
          attributes: ["id", "title", "start_date", "end_date", "periority"],
          include: [
            {
              model: Status,
              reuired: false,
              attributes: ["id", "name", "color", "category"],
            },
            {
              model: User,
              reuired: false,
              attributes: ["id", "avatar", "name", "email"],
              through: {
                attributes: [],
              },
            },
          ],
        },
        {
          model: Checklist,
          reuired: false,
          attributes: ["id", "title"],
          include: {
            model: ChecklistItems,
            attributes: ["id", "title", "is_completed"],
            include: {
              model: User,
              reuired: false,
              attributes: ["id", "avatar", "name", "email"],
              through: {
                attributes: [],
                model: User_checklist,
              },
            },
          },
        },
        {
          model: Comment,
          attributes: ["id", "content", "createdAt", "updatedAt"],
          include: [
            {
              model: User,
              reuired: false,
              attributes: ["id", "avatar", "name", "email"],
            },
            {
              model: Like,
              required: false,
              attributes: ["id"],
            },
          ],
        },
        {
          model: Task_attach,
          reuired: false,
          attributes: ["id", "name", "extension"],
        },
        {
          model: Task_dependency,
          as: "taskDependencies",
          attributes: ["id", "status"],
          include: {
            model: Task,
            as: "dependency",
            attributes: ["id", "title"],
          },
        },
      ],
    });
    if (!task) {
      throw new Error("task not found!");
    }

    config.handelAvatar(task.dataValues.users, "avatar", "avatar", users_path);
    task.dataValues.subtasks.map((subtask) => {
      config.handelAvatar(
        subtask.dataValues.users,
        "avatar",
        "avatar",
        users_path
      );
      subtask.start_date =
        subtask.start_date == null
          ? subtask.start_date
          : config.handleDateForamat(subtask.start_date);
      subtask.end_date =
        subtask.end_date == null
          ? subtask.end_date
          : config.handleDateForamat(subtask.end_date);
    });

    task.dataValues.checklists.map((checklist) => {
      checklist.checklist_items.map((checklist_item) => {
        config.handelAvatar(
          checklist_item.dataValues.users,
          "avatar",
          "avatar",
          users_path
        );
      });
    });

    config.handelAvatar(
      task.dataValues.task_attachs,
      "path",
      "name",
      task_img_path,
      "tasks"
    );

    task.dataValues.comments.map((comment) => {
      let owner_avatar = comment.dataValues.user.avatar;
      let likes = comment.dataValues.likes;
      let created_at = comment.dataValues.createdAt;
      let updated_at = comment.dataValues.updatedAt;
      comment.dataValues.user.avatar = users_path + owner_avatar;
      comment.dataValues.likes = likes.length;
      comment.dataValues.createdAt = config.handleDateForamat(created_at);
      comment.dataValues.updatedAt = config.handleDateForamat(updated_at);
    });
    task.dataValues.users.map((user) => {
      user.dataValues.isSelected = true;
    });

    task.dataValues.start_date =
      task.dataValues.start_date == null
        ? task.dataValues.start_date
        : config.handleDateForamat(task.dataValues.start_date);
    task.dataValues.end_date =
      task.dataValues.end_date == null
        ? task.dataValues.end_date
        : config.handleDateForamat(task.dataValues.end_date);

    return res.status(200).json({
      status_code: 200,
      data: task,
      message: "ok",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};

exports.updateTaskByID = async (req, res, next) => {
  const taskId = req.params.id;
  const {
    title,
    start_date,
    end_date,
    description,
    periority,
    is_favourite,
    listId,
    statusId,
    new_entry_tags,
    removed_tags,
    deletedTags,
    assignees,
    removed_assignees,
  } = req.body;

  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error("Task Not Found To Update !");
    }
    const isAssigned = await User_task.findOne({
      where: {
        userId: req.id,
        taskId: task.id,
      },
    });

    if (!isAssigned && req.id != task.userId) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "You are not authorized to update this task",
      });
    }

    await task.update({
      title,
      start_date,
      end_date,
      description,
      periority,
      is_favourite,
      listId,
      statusId,
    });

    if (new_entry_tags && new_entry_tags.length > 0) {
      const createdTags = await Promise.all(
        new_entry_tags.map(async (tag_obj) => {
          const newTag = await Tag.create({
            name: tag_obj.name,
            color: tag_obj.color,
            userId: +req.id,
          });
          await Task_tag.create({
            TagId: newTag.id,
            taskId: task.id,
          });
          return newTag;
        })
      );
    }

    if (removed_tags && removed_tags.length > 0) {
      await Task_tag.destroy({
        where: {
          TagId: {
            [Op.in]: removed_tags,
          },
        },
        taskId: task.id,
      });
    }

    if (deletedTags && deletedTags.length > 0) {
      await Task_tag.destroy({
        where: {
          TagId: {
            [Op.in]: deletedTags,
          },
        },
      });
      await Tag.destroy({
        where: {
          id: {
            [Op.in]: deletedTags,
          },
        },
      });
    }

    if (assignees && assignees.length > 0) {
      await Promise.all(
        assignees.map(async (userId) => {
          await User_task.create({
            userId,
            taskId: task.id,
          });
        })
      );
    }

    if (removed_assignees && removed_assignees.length > 0) {
      await User_task.destroy({
        where: {
          userId: {
            [Op.in]: removed_assignees,
          },
          taskId: task.id,
        },
      });
    }
    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "Task updated successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: err.message });
  }
};


exports.updateTaskOrder = async (req, res, next) => {
  const { taskId, order, statusId } = req.body;
  try {
    const task = await Task.findByPk(taskId);
    if (task != null) {
      const listId = task.dataValues.listId;
      if (task.dataValues.statusId == statusId) {
        if (order > task.dataValues.order) {
          await Task.decrement("order", {
            where: {
              listId,
              statusId,
              order: {
                [Op.gt]: task.dataValues.order,
                [Op.lte]: order,
              },
            },
          });
          await task.update({ order });
        } else if (order < task.dataValues.order) {
          await Task.increment("order", {
            where: {
              listId,
              statusId,
              order: {
                [Op.lt]: task.dataValues.order,
                [Op.gte]: order,
              },
            },
          });
          await task.update({ order });
        }
      } else {
        await Task.decrement("order", {
          where: {
            listId,
            statusId: task.dataValues.statusId,
            order: {
              [Op.gt]: task.dataValues.order,
            },
          },
        });
        await Task.increment("order", {
          where: {
            listId,
            statusId,
            order: {
              [Op.gte]: order,
            },
          },
        });
        await task.update({ order, statusId });
      }
      return res.status(200).json({
        status_code: 200,
        message: "task order updated successfully",
        data: null,
      });
    } else {
      throw Error("task is not found");
    }
  } catch (error) {
    return res
      .status(500)
      .json({ status_code: 500, message: error.message, data: null });
  }
};


exports.getListOfTasks = (req, res, next) => {
  Task.findAll({
    attributes: ["id", "title", [Sequelize.col("status.color"), "color"]],
    include: [
      {
        model: Status,
        attributes: [],
      },
      {
        model: User,
        through: {
          attributes: [],
        },
        reuired: false,
        attributes: ["avatar"],
      },
    ],
    where: { id: { [Op.ne]: req.params.id } },
  })
    .then((data) => {
      data.map((task) => {
        task.users.map((user) => {
          user.dataValues.avatar = users_path + user.dataValues.avatar;
        });
      });
      res.status(200).json({
        status_code: 200,
        data,
        message: "ok",
      });
    })
    .catch((error) => {
      res.status(500).json({
        status_code: 500,
        data: null,
        message: error.message,
      });
    });
};

exports.getTaskDependencies = (req, res, next) => {
  Task_dependency.findAll({
    where: {
      taskId: req.params.id,
    },
    attributes: ["id", "status"],
    include: [
      {
        model: Task,
        as: "dependency", 
        attributes: ["id", "title"],
      },
    ],
  })
    .then((data) => {
      res.status(200).json({
        status_code: 200,
        data,
        message: "ok",
      });
    })
    .catch((error) => {
      res.status(500).json({
        status_code: 500,
        data: null,
        message: error,
      });
    });
};


exports.getAllTaskLists = (req, res, next) => {
  const spaceId = req.params.id;
  const limit = req.query.rows ? +req.query.rows : 10;
  const offset = req.query.page ? (req.query.page - 1) * limit : 0;
  Task.findAndCountAll({
    attributes: [
      "id",
      "title",
      "start_date",
      "end_date",
      "description",
      "periority",
      [Sequelize.col("taskOwner.avatar"), "owner_avatar"],
    ],
    where: {
      spaceId: spaceId,
    },

    include: [
      {
        model: Status,
        required: false,
        attributes: ["id", "name", "color", "category"],
      },
      {
        model: User,
        required: false,
        as: "taskOwner",
        attributes: [],
      },
    ],
    limit: limit,
    offset: offset,
  })
    .then((tasks) => {
      console.log("hi");
      const calculatePageNumber = (pageSize, itemIndex) => {
        return Math.ceil(+itemIndex / pageSize);
      };
      const page_number = calculatePageNumber(limit, tasks.count);
      if (tasks.rows.length == 0) {
        res
          .status(200)
          .json({ status_code: 200, message: "this tasks page is empty" });
      } else if (tasks.rows.length > 0) {
        for (let i = 0; i < tasks.rows.length; i++) {
          tasks.rows[i].dataValues.description =
            tasks.rows[i].dataValues.description.slice(0, 100) + `...`;
          tasks.rows[i].dataValues.owner_avatar =
            users_path + tasks.rows[i].dataValues.owner_avatar;
          tasks.rows[i].dataValues.start_date = new Date(
            tasks.rows[i].dataValues.start_date
          ).toLocaleDateString("en-GB");
          tasks.rows[i].dataValues.end_date = new Date(
            tasks.rows[i].dataValues.end_date
          ).toLocaleDateString("en-GB");
        }
        res.status(200).json({
          status_code: 200,
          data: { page_number, count: tasks.count, tasks: tasks.rows },
          message: "ok",
        });
      } else
        res.status(200).json({
          status_code: 200,
          data: { page_number, count: tasks.count, tasks: tasks.rows },
          message: "ok",
        });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status_code: 500, message: err.message, data: null });
    });
};


exports.deleteOneTaskById = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error("task not found to delete or is already deleted!");
    }
    const isAssigned = await User_task.findOne({
      where: {
        userId: req.id,
        taskId: task.id,
      },
    });
    if (!isAssigned && task.dataValues.userID !== +req.id) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message:
          "you are forbidden to access this resources only task owner can delete this task",
      });
    }
    await task.destroy();

    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "task deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};
