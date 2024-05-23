const { body, check, param } = require("express-validator");
const Status = require("../models/status");
const Tag = require("../models/tag");
const { Op } = require("sequelize");
const User = require("../../user/user.model");
const User_task = require("../models/user_task");

function isValidDateTime(value) {
  // Regular expression to match the format YYYY-MM-DD HH:mm:ss
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return dateTimeRegex.test(value);
}

exports.createTaskValidation = [
  body("title")
    .notEmpty()
    .withMessage("task title is required")
    .isString()
    .withMessage("task title must be a string")
    .isLength({ max: 191 })
    .withMessage("task title must be less than 191 characters long"),
  body("start_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("start_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("end_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("end_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("periority")
    .optional()
    .isString()
    .withMessage("task periority must be a string"),
  body("listId")
    .notEmpty()
    .withMessage("listId is required")
    .isNumeric()
    .withMessage("listId must be a number"),
  body("workspace_id")
    .notEmpty()
    .withMessage("workspace_id is required")
    .isNumeric()
    .withMessage("workspace_id must be a number"),
  // validate tag id
  body("tagId").optional().isArray().withMessage("tagId must be an array"),
  check("tagId").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("tagId must be an array of numbers");
    } else {
      const tags = await Tag.findAll({
        where: {
          id: {
            [Op.in]: value,
          },
        },
      });
      if (tags.length !== value.length) {
        const existingTagIds = tags.map((tag) => tag.id);
        const missingTagIds = value.filter(
          (id) => !existingTagIds.includes(id)
        );
        if (missingTagIds.length > 0) {
          throw new Error(`Tag IDs ${missingTagIds.join(", ")} do not exist`);
        }
      }
    }
  }),
  body("statusId")
    .optional()
    .isNumeric()
    .withMessage("statusId must be a number"),
  // handel new_statuses array
  body("new_statuses")
    .optional()
    .isArray()
    .withMessage("new_statuses must be an array."),
  body("new_statuses.*.name")
    .notEmpty()
    .withMessage('Each new_statuses object must have an "name" property.')
    .isString()
    .withMessage("new_statuses name must be a string."),
  check("new_statuses.*.name")
    .optional()
    .custom(async (value, req) => {
      let status = await Status.findOne({
        where: { name: value, listId: +req.req.body.listId },
      });
      if (status != null) {
        return Promise.reject("status already exist in this list");
      }
    }),
  body("new_statuses.*.color")
    .notEmpty()
    .withMessage('Each new_statuses object must have an "color" property.')
    .isString()
    .withMessage("new_statuses color must be a string."),
  body("status_name")
    .optional()
    .isString()
    .withMessage("status_name must be a string."),

  // handel subtask array
  body("subtasks")
    .optional()
    .isArray()
    .withMessage("subtasks must be an array."),
  body("subtasks.*.title")
    .notEmpty()
    .withMessage('Each subtask object must have an "title" property.')
    .isString()
    .withMessage("title must be a string."),
  body("subtasks.*.start_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage(
      "each subtask start_date must match the format YYYY-MM-DD HH:mm:ss"
    ),
  body("subtasks.*.end_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage(
      "each subtask end_date must match the format YYYY-MM-DD HH:mm:ss"
    ),
  body("subtasks.*.periority")
    .optional()
    .isString()
    .withMessage(
      `'Each subtask object must have a string "periority" property`
    ),
  body("subtasks.*.subtask_status_id")
    .optional()
    .isNumeric()
    .withMessage(
      `'Each subtask object must have a number "subtask_status_id" property`
    ),
  // start of assignees validation inside subtasks  array
  body("subtasks.*.assignees")
    .optional()
    .isArray()
    .withMessage("subtasks assignees must be a array."),
  check("subtasks.*.assignees").custom((value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("subtasks assignees must be a array of number");
      // check that assignees contains Integers
    } else {
      return User.findAll({
        where: {
          id: {
            [Op.in]: value,
          },
        },
      }).then((users) => {
        if (users.length !== value.length) {
          return Promise.reject(
            "some users is not exist to assign to subtasks"
          );
        }
      });
    }
  }),
  // validate task assignees
  body("assignees")
    .optional()
    .isArray()
    .withMessage("task assignees must be a array."),
  check("assignees")
    .optional()
    .custom((value) => {
      if (!value.every(Number.isInteger)) {
        throw new Error("task assignees must be a array of number");
        // check that assignees contains Integers
      } else {
        return User.findAll({
          where: {
            id: {
              [Op.in]: value,
            },
          },
        }).then((users) => {
          if (users.length !== value.length) {
            return Promise.reject(
              "some users is not exist to assign to this task"
            );
          }
        });
      }
    }),

  // end of subtask array validation
  // validate checklists array
  body("checklists")
    .optional()
    .isArray()
    .withMessage("checklists must be an array."),
  body("checklists.*.title")
    .notEmpty()
    .withMessage('Each checklist object must have an "title" property.')
    .isString()
    .withMessage("checklist title must be a string."),
  body("checklists.*.items")
    .optional()
    .isArray()
    .withMessage("checklist items must be an array."),
  body("checklists.*.items.*.title")
    .notEmpty()
    .withMessage('Each checklist items object must have an "title" property.')
    .isString()
    .withMessage("checklist items title must be a string."),
  // start of assignees validation inside checklist  array
  body("checklists.*.items.*.assignees")
    .optional()
    .isArray()
    .withMessage("checklists items assignees must be a array."),
  check("checklists.*.assignees").custom((value) => {
    value = value ? value : [];
    console.log("teeeeeest", value);
    if (Array.isArray(value)) {
      console.log("enter the condition");
      if (!value.every(Number.isInteger)) {
        throw new Error("checklists items assignees must be a array of number");
        // check that checklists assignees contains Integers
      } else {
        return User.findAll({
          where: {
            id: {
              [Op.in]: value,
            },
          },
        }).then((users) => {
          if (users.length !== value.length) {
            return Promise.reject(
              "some users is not exist to assign to checklists"
            );
          }
        });
      }
    }
  }),

  // validate attatchments
  body("attatchments")
    .optional()
    .isArray()
    .withMessage("attatchments must be an array."),
  check("attatchments").custom(async (value, req) => {
    value = value ? value : [];
    // console.log("valueee===>", value);
    if (!value.every((item) => typeof item === "string")) {
      throw new Error("attatchments must be a array of strings");
      // check that contains strings
    }
    console.log("reeeqeq  ====> ", req.req.body.filesnames);
    if (req.req.body.attatchments != undefined) {
      if (req.req.body.filesnames == undefined) {
        return Promise.reject(`filesnames required when you add attatchments`);
      }
    }
  }),
  body("filesnames")
    .optional()
    .isArray()
    .withMessage("filesnames must be an array."),
  // validate dependencies
  body("dependencies")
    .optional()
    .isArray()
    .withMessage("dependencies must be an array."),
  body("dependencies.*.status")
    .notEmpty()
    .withMessage('Each dependencies object must have an "status" property.')
    .isIn(["Waiting on", "Blocking"])
    .withMessage("dependencies status must be only Waiting on or Blocking ."),
  body("dependencies.*.dependencies_tasks")
    .notEmpty()
    .withMessage(
      `Each dependencies object must have an "dependencies_tasks" property.`
    )
    .isArray()
    .withMessage("dependencies dependencies_tasks must be an array."),
  // validate new_entry_tags
  body("new_entry_tags")
    .optional()
    .isArray()
    .withMessage("new_entry_tags must be an array."),
  body("new_entry_tags.*.name")
    .notEmpty()
    .withMessage('Each new_entry_tags object must have a "name" property.')
    .isString()
    .withMessage(`new_entry_tags "name" property  must be a string.`),
  check("new_entry_tags.*.name").custom((value) => {
    return Tag.findOne({ where: { name: value } }).then((tag) => {
      if (tag) {
        return Promise.reject(
          `new_entry_tags object "name" property already in use`
        );
      }
    });
  }),
  body("new_entry_tags.*.color")
    .notEmpty()
    .withMessage('Each new_entry_tags object must have a "color" property.')
    .isString()
    .withMessage(`new_entry_tags "color" property  must be a string.`),
];

exports.validateUpdateTask = [
  body("title")
    .optional()
    .isString()
    .withMessage("task title must be a string")
    .isLength({ max: 191 })
    .withMessage("task title must be less than 191 characters long"),
  body("start_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("start_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("end_date")
    .optional()
    .custom((value) => isValidDateTime(value))
    .withMessage("end_date must match the format YYYY-MM-DD HH:mm:ss"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),
  body("periority")
    .optional()
    .isString()
    .withMessage("task periority must be a string"),
  body("listId").optional().isNumeric().withMessage("listId must be a number"),
  // validate new_entry_tags
  body("new_entry_tags")
    .optional()
    .isArray()
    .withMessage("new_entry_tags must be an array."),
  body("new_entry_tags.*.name")
    .notEmpty()
    .withMessage('Each new_entry_tags object must have a "name" property.')
    .isString()
    .withMessage(`new_entry_tags "name" property  must be a string.`),
  check("new_entry_tags.*.name").custom((value) => {
    return Tag.findOne({ where: { name: value } }).then((tag) => {
      if (tag) {
        return Promise.reject(`new_entry_tags name already in use`);
      }
    });
  }),
  body("new_entry_tags.*.color")
    .notEmpty()
    .withMessage('Each new_entry_tags object must have a "color" property.')
    .isString()
    .withMessage(`new_entry_tags "color" must be a string.`),

  // validate tag id
  body("removed_tags")
    .optional()
    .isArray()
    .withMessage("removed_tags must be an array"),
  check("removed_tags").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("removed_tags must be an array of numbers");
    }
  }),
  body("deletedTags")
    .optional()
    .isArray()
    .withMessage("deletedTags must be an array"),
  check("deletedTags").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("deletedTags must be an array of numbers");
    }
  }),
  body("statusId")
    .optional()
    .isNumeric()
    .withMessage("statusId must be a number"),
  body("assignees")
    .optional()
    .isArray()
    .withMessage("task assignees must be an array."),
  check("assignees")
    .optional()
    .custom((value, req) => {
      if (value && value.length > 0) {
        const taskId = +req.req.params.id;
        console.log("====", value, taskId);
        console.log("====", [].length);
        return User_task.findAll({
          where: {
            userId: {
              [Op.in]: value,
            },
            taskId: taskId,
          },
        }).then((assigneees) => {
          if (assigneees.length > 0) {
            return Promise.reject(
              "some users or this user is already assigned to this task"
            );
          } else return;
        });
      } else return;
    }),
  body("removed_assignees")
    .optional()
    .isArray()
    .withMessage("task removed_assignees must be an array."),
];

exports.validateUpdateTaskOrder = [
  body("taskId")
    .notEmpty()
    .withMessage("taskId is required")
    .isNumeric()
    .withMessage("taskId must be a number "),
  body("statusId")
    .notEmpty()
    .withMessage("statusId  is required")
    .isNumeric()
    .withMessage("statusId must be a number"),
  body("order")
    .notEmpty()
    .withMessage("order is required")
    .isNumeric()
    .withMessage("order must be a number"),
];

exports.validateAddNewDependency = [
  body("taskId")
    .notEmpty()
    .withMessage("taskId is required")
    .isNumeric()
    .withMessage("taskId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("taskId must be between 3 and 30 characters long"),
  body("dependencies")
    .optional()
    .isArray()
    .withMessage("dependencies must be an array."),
  body("dependencies.*.status")
    .notEmpty()
    .withMessage('Each dependencies object must have an "status" property.')
    .isIn(["Waiting on", "Blocking"])
    .withMessage("dependencies status must be only Waiting on or Blocking ."),
  body("dependencies.*.dependencies_tasks")
    .notEmpty()
    .withMessage(
      `Each dependencies object must have an "dependencies_tasks" property.`
    )
    .isArray()
    .withMessage("dependencies dependencies_tasks must be an array."),
];

exports.validateAddNewAttachment = [
  // validate attatchments
  body("attatchments")
    .notEmpty()
    .withMessage("attatchments is required")
    .isArray()
    .withMessage("attatchments must be an array."),
  check("attatchments").custom(async (value) => {
    value = value ? value : [];
    // console.log("valueee===>", value);
    if (!value.every((item) => typeof item === "string")) {
      throw new Error("attatchments must be a array of strings");
      // check that contains strings
    }
  }),
  body("filesnames")
    .notEmpty()
    .withMessage("filesnames is required")
    .isArray()
    .withMessage("filesnames must be an array."),
  body("taskId")
    .notEmpty()
    .withMessage("taskId is required")
    .isNumeric()
    .withMessage("taskId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("taskId must be between 3 and 30 characters long"),
];
exports.validateAttachmentsUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage(`name must be a string`)
    .isLength({ max: 50 })
    .withMessage("name must be less than 50 characters long"),
];

exports.validateParamsID = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("task id must be between 3 and 30 characters long"),
];
exports.validateTasksListParamsID = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("task id must be between 3 and 30 characters long"),
];
