const Task = require("../task/models/task");
const Status = require("../task/models/status");
const User_subtask = require("./user_subtask.model");
const User = require("../user/user.model");
const Sequelize = require("sequelize");
const Task_attach = require("../task/models/task_attachs");
// const Users_path  =        path_to_user


exports.createNewSubtask = async (req, res, next) => {
  const {
    title,
    start_date,
    end_date,
    periority,
    user_ids,
    status_id,
    task_id,
  } = req.body;
  try {
    const subtask = await Subtask.create({
      title: title,
      start_date: start_date,
      end_date: end_date,
      periority: periority,
      statusId: status_id,
      taskId: task_id,
    });

    createAsigneeInstances(subtask, user_ids);
    return res.status(200).json({
      status_code: 200,
      message: "Subtask created successfully",
      data: null,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status_code: 500, message: err.message, data: null });
  }
};

exports.getSubtaskById = async (req, res, next) => {
  try {
    const subtask = await findSubtaskById(req.params.id);
    return res
      .status(200)
      .json({ status_code: 200, message: "", data: subtask });
  } catch (err) {
    return res
      .status(500)
      .json({ status_code: 500, message: err.message, data: null });
  }
};

exports.updateSubtask = async (req, res, next) => {
  const {
    title,
    start_date,
    end_date,
    periority,
    status_id,
    task_id,
    deleted_assigns,
    added_assigns,
  } = req.body;

  try {
    const subtask = await findSubtaskById(req.params.id);
    await subtask.update({
      title: title,
      start_date: start_date,
      end_date: end_date,
      periority: periority,
      statusId: status_id,
      taskId: task_id,
    });

    await createAsigneeInstances(subtask, added_assigns);
    await deleteAsigneeInstances(subtask, deleted_assigns);

    return res
      .status(200)
      .json({
        status_code: 200,
        message: "Subtask updated successfully",
        data: null,
      });
  } catch (err) {
    res.status(500).json({
      status_code: 500,
      message: err.message,
      data: null,
    });
  }
};

exports.deleteSubtask = async (req, res, next) => {
  try {
    const subtask = await findSubtaskById(req.params.id);
    await subtask.destroy();

    return res
      .status(200)
      .json({
        status_code: 200,
        message: "Subtask Deleted successfully",
        data: null,
      });
  } catch (err) {
    res.status(500).json({
      status_code: 500,
      message: err.message,
      data: null,
    });
  }
};

// helper functions
async function findSubtaskById(subtaskId) {
  const subtask = await Subtask.findByPk(subtaskId, {
    attributes: ["id", "title", "start_date", "end_date", "periority"],
    include: [
      {
        model: Task,
        attributes: ["id", "title"],
        
      },
      {
        model: Status,
        attributes: ["id", "name", "color"],
      },
     
      {
        model: User,
        attributes: ["id", "name", "email", "avatar"],
        through: {
          model: User_subtask,
          attributes: [],
        },
      },
      {
        model: Checklist,
        attributes: ["id", "title", "is_completed"],
        include:[{model: User,attributes: ["id", "name", "email", "avatar"], through: {
          model: User_checklist,
          attributes: [],
        },}]
      },
      {
        model: Comment,
        attributes: ["id", "content"],
        include:[{
          model: Mention,
          attributes: ["id"],
          include:[{model: User,attributes: ["id", "name", "email", "avatar"]}]
        },
        {
          model: Like,
          attributes: ["id"]
          
        },
        {
          model: Comment_attach,
          attributes: ["id", "name"],
        },
   
        ],

       
      },
    ],
  });
  if (!subtask) {
    throw new Error("Subtask not found");
  }

  for (const item of subtask.dataValues.Checklists) {
    for(const user of item.dataValues.users){
      user.dataValues.avatar = Users_path + user.dataValues.avatar
    }
  }

  for (const item of subtask.dataValues.users) {
    item.dataValues.avatar = Users_path + item.dataValues.avatar
  }

  for(const item of subtask.dataValues.comments){
    console.log(item.dataValues.mentions ,";;;;;;;;;;;;;;;;;;;;;;;;;;");
    console.log(subtask.dataValues.comments[0].likes , "-------------------");
    item.dataValues.likes = item.dataValues.likes.length
    for(const attach of item.dataValues.comment_attachs){
      attach.dataValues.path = attach.dataValues.name.substr(-3) === "pdf" ? Attachments_filepath + attach.dataValues.name : Attachments_imgpath + attach.dataValues.name
    }

    for(const mention of item.dataValues.mentions){
      mention.dataValues.user.avatar = Users_path + mention.dataValues.user.avatar
    }
  }
  
  return subtask;
}

async function deleteAsigneeInstances(subtask, usersIds) {
  if (!usersIds?.length) {
    return;
  }
  for (const userId of usersIds) {
    await deleteOneAsigneeInstance(subtask.id, userId);
  }
}

async function deleteOneAsigneeInstance(subtaskId, userId) {
  await User_subtask.destroy({ where: { userId, subtaskId } });
}

async function createAsigneeInstances(subtask, usersIds) {
  if (!usersIds?.length) {
    return;
  }
  for (const userId of usersIds) {
    await createOneAsigneeInstance(subtask.id, userId);
  }
}

async function createOneAsigneeInstance(subtaskId, userId) {
  await User_subtask.create({
    userId: userId,
    subtaskId: subtaskId,
  });
}
