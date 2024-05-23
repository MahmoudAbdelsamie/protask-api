const { body, check, param } = require("express-validator");
const Space = require("./space.model");
const UserSpace = require("./user_space.model");
const Workspace = require("../workspace/workspace.model");
exports.spaceValidationAdd = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isString()
    .withMessage("name must be a string")
    .isLength({ max: 191 })
    .withMessage("userName must be less than 191 characters long"),
  check("name").custom((value, req) => {
    return Space.findOne({
      where: { name: value, workspaceId: +req.req.body.workspace_id },
    }).then((space) => {
      if (space) {
        return Promise.reject("space name already in use in this workspace");
      }
    });
  }),
  body("color")
    .notEmpty()
    .withMessage("color is required")
    .isString()
    .withMessage("color must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),
  body("Icon")
    .notEmpty()
    .withMessage("Icon is required")
    .isString()
    .withMessage("icon must be a string")
    .isLength({ max: 191 })
    .withMessage("icon must be less than 191 characters long"),
  body("workspace_id")
    .notEmpty()
    .withMessage("workspace_id is required")
    .isNumeric()
    .withMessage("workspace_id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspace_id  must be between 1 and 30 characters long"),
  body("assignees")
    .optional()
    .isArray()
    .withMessage("assignees must be an array."),
  body("assignees.*.id")
    .notEmpty()
    .withMessage('Each assignees object must have an "id" property.')
    .isNumeric()
    .withMessage("id must be a valid id."),
  body("assignees.*.role")
    .notEmpty()
    .withMessage('Each user object must have a "role" property.')
    .isIn(["admin", "member", "guest"])
    .withMessage("role must be only admin or member or guest "),
];

exports.updateSpaceValidation = [
  body("name")
    .optional()
    .isString()
    .withMessage("name must be a string")
    .isLength({ max: 191 })
    .withMessage("userName must be less than 191 characters long"),
  check("name")
    .optional()
    .custom((value, req) => {
      return Space.findOne({
        where: { name: value, workspaceId: +req.req.body.workspace_id },
      }).then((space) => {
        if (space) {
          if (space.dataValues.id !== +req.req.params.id) {
            return Promise.reject(
              "space name already in use in this workspace"
            );
          }
        }
      });
    }),
  body("color")
    .optional()
    .isString()
    .withMessage("color must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),
  body("Icon")
    .optional()
    .isString()
    .withMessage("icon must be a string")
    .isLength({ max: 191 })
    .withMessage("icon must be less than 191 characters long"),
  body("is_favourite")
    .optional()
    .isBoolean()
    .withMessage("is_favourite must be only boolean")
    .isLength({ max: 191 })
    .withMessage("is_favourite must be less than 191 characters long"),
  body("assignees")
    .optional()
    .isArray()
    .withMessage("assignees must be an array."),
  body("assignees.*.id")
    .notEmpty()
    .withMessage('Each assignees object must have an "id" property.')
    .isNumeric()
    .withMessage("id must be a valid id."),
  body("assignees.*.role")
    .notEmpty()
    .withMessage('Each user object must have a "role" property.')
    .isIn(["admin", "member", "guest"])
    .withMessage("role must be only admin or member or guest "),
  body("assignees.*.email")
    .notEmpty()
    .withMessage("assignees email is required")
    .isEmail()
    .withMessage("email must be a valid email")
    .isLength({ max: 191 })
    .withMessage("email must be less than 191 characters long"),
  body("deleted_assignees")
    .optional()
    .isArray()
    .withMessage("deleted_assignees must be an array."),
  body("deleted_assignees.*.id")
    .notEmpty()
    .withMessage('Each deleted_assignees object must have an "id" property.')
    .isNumeric()
    .withMessage("userId must be a valid id."),
  body("deleted_assignees.*.email")
    .notEmpty()
    .withMessage("deleted_assignees email is required")
    .isEmail()
    .withMessage("email must be a valid email")
    .isLength({ max: 191 })
    .withMessage("email must be less than 191 characters long"),

  body("updated_assignees")
    .optional()
    .isArray()
    .withMessage("updated_assignees must be an array."),
  body("updated_assignees.*.id")
    .notEmpty()
    .withMessage('Each updated_assignees object must have an "id" property.')
    .isNumeric()
    .withMessage("id must be a valid id."),
  body("updated_assignees.*.role")
    .notEmpty()
    .withMessage('Each user object must have a "role" property.')
    .isIn(["admin", "member", "guest"])
    .withMessage("role must be only admin or member or guest "),
  body("updated_assignees.*.email")
    .notEmpty()
    .withMessage("updated_assignees email is required")
    .isEmail()
    .withMessage("email must be a valid email")
    .isLength({ max: 191 })
    .withMessage("email must be less than 191 characters long"),
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("space id must be between 1 and 30 characters long"),
];

exports.getSpaceListValidation = [
  body("workspace_id")
    .notEmpty()
    .withMessage("Workspace id is required")
    .isNumeric()
    .withMessage("Id must be a number")
    .isLength({ max: 191 })
    .withMessage("Id must be less than 191 characters long"),
  check("workspace_id").custom((value, req) => {
    return Workspace.findOne({
      where: { id: +req.req.body.workspace_id },
    }).then((Workspace) => {
      if (!Workspace) {
        return Promise.reject("Workspace not found !!");
      }
    });
  }),
];

exports.validateParamsID = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage(" id must be between 1 and 30 characters long"),
];

exports.validateDuplicationName = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isString()
    .withMessage("name must be a string")
    .isLength({ max: 191 })
    .withMessage("Space must be less than 191 characters long"),
  check("name").custom(async (value, req) => {
    let spaceToDuplicate = await Space.findByPk(+req.req.params.id);
    return Space.findOne({
      where: { name: value, workspaceId: +spaceToDuplicate.workspaceId },
    }).then((space) => {
      if (space) {
        return Promise.reject("space name already in use in this workspace");
      }
    });
  }),
];

exports.validateCustomDuplication = [
  body("listIds").optional().isArray().withMessage("listIds must be a array"),
  check("listIds").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("listIds must be a array of number");
    }
  }),
  body("foldersIds")
    .optional()
    .isArray()
    .withMessage("foldersIds must be a array"),
  check("foldersIds").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("foldersIds must be a array of number");
    }
  }),
  body("listsInFolders")
    .optional()
    .isArray()
    .withMessage("listsInFolders must be a array"),
  check("listsInFolders").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("listsInFolders must be a array of number");
    }
  }),
  body("whiteboardsIds")
    .optional()
    .isArray()
    .withMessage("whiteboardsIds must be a array"),
  check("whiteboardsIds").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("whiteboardsIds must be a array of number");
    }
  }),
  body("docsIds").optional().isArray().withMessage("docsIds must be a array"),
  check("docsIds").custom(async (value) => {
    value = value ? value : [];
    if (!value.every(Number.isInteger)) {
      throw new Error("docsIds must be a array of number");
    }
  }),
  body("taskOptions")
    .optional()
    .isArray()
    .withMessage("taskOptions must be a array"),
  check("taskOptions").custom(async (value) => {
    value = value ? value : [];
  }),
];
