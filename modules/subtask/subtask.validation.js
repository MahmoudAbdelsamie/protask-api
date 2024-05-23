const { body, check, param } = require("express-validator");
const Task = require("../task/models/task");
const Status = require("../task/models/status");
const Users = require("../user/user.model");
const Users_subtask = require("./user_subtask.model");

const { Op } = require("sequelize"); // Assuming you have Sequelize configured

function isValidDateTime(value) {
  // Regular expression to match the format YYYY-MM-DD HH:mm:ss
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return dateTimeRegex.test(value);
}

exports.createSubtaskValidation = [
  body("title")
    .notEmpty()
    .withMessage("Subtask title is required")
    .isString()
    .withMessage("Subtask title must be a string")
    .isLength({ max: 191 })
    .withMessage("Subtask title must be less than 191 characters long"),
  body("start_date")
    .notEmpty()
    .withMessage("start_date is required")
    .custom((value) => isValidDateTime(value))
    .withMessage("start_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("end_date")
    .notEmpty()
    .withMessage("end_date is required")
    .custom((value) => isValidDateTime(value))
    .withMessage("end_date must match the format YYYY-MM-DD HH:mm:ss"),

  body("periority")
    .notEmpty()
    .withMessage("Subtask periority is required")
    .isString()
    .withMessage("Subtask periority must be a string"),
 
  body("status_id")
    .notEmpty()
    .withMessage("Staus_id is required")
    .isNumeric()
    .withMessage("Status_id must be a number"),
  check("status_id").custom((value) => {
    return Status.findOne({ where: { id: value } }).then((status) => {
      if (!status) {
        return Promise.reject("status_id is not exist");
      }
    });
  }),
  body("task_id")
    .notEmpty()
    .withMessage("task_id is required")
    .isNumeric()
    .withMessage("task_id must be a number"),
  check("task_id").custom((value) => {
    return Task.findOne({ where: { id: value } }).then((task) => {
      if (!task) {
        return Promise.reject("task_id is not exist");
      }
    });
  }),
];

exports.updateSubtaskValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Subtask title must be a string")
    .isLength({ max: 191 })
    .withMessage("Subtask title must be less than 191 characters long"),
  body("start_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("start_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("end_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("end_date must match the format YYYY-MM-DD HH:mm:ss"),

  body("periority")
    .optional()
    .isString()
    .withMessage("Subtask periority must be a string"),
 
  body("status_id")
    .optional()
    .isNumeric()
    .withMessage("Status_id must be a number"),
  check("status_id").custom((value) => {
    return Status.findOne({ where: { id: value } }).then((status) => {
      if (!status) {
        return Promise.reject("status_id is not exist");
      }
    });
  }),
  body("task_id")
    .optional()
    .isNumeric()
    .withMessage("task_id must be a number"),
  check("task_id").custom((value) => {
    return Task.findOne({ where: { id: value } }).then((task) => {
      if (!task) {
        return Promise.reject("task_id is not exist");
      }
    });
  }),

  body("added_assigns")
  .optional()
  .isArray()
    .withMessage("added_assigns must be a array"),
  check("added_assigns").custom(async (value , req) => {
    console.log("========================================================",req.req.params.id);
    if (!value.every(Number.isInteger)) {
      throw new Error("added_assigns must be a array of number");
      // check that contains Integers
    } else {
      const added_users = await Users.findAll({
        where: {
          id: {
            [Op.in]: value,
          },
        },
      });

      const duplicated_relation = await Users_subtask.findAll({
        where: {
          userId: {
            [Op.in]: value,
          },
          subtaskId: +req.req.params.id
        },
      });

      if (added_users.length !== value.length) {
        console.log();
        //  user IDs were not found in DB
        throw new Error("user id not exist");
      }

      if (duplicated_relation.length != 0) {
        throw new Error("user id is already related to this subtask");
        
      }
    }
}),

body("deleted_assigns")
.optional()
.isArray()
  .withMessage("deleted_assigns must be a array"),
check("deleted_assigns").custom(async (value , req) => {
  console.log(req.req.params.id);
  if (!value.every(Number.isInteger)) {
    throw new Error("deleted_assigns must be a array of number");
    // check that contains Integers
  } else {
    const delted_users = await Users_subtask.findAll({
      where: {
        userId: {
          [Op.in]: value,
        },
        subtaskId: +req.req.params.id
      },
    });

    if (delted_users.length !== value.length) {
      //  tag IDs were not found in DB
      throw new Error("user id is not related to any tasks to delete");
    }
  }
}),
];


exports.validateParamsID = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("space id must be between 3 and 30 characters long"),
];
