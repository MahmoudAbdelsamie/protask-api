const { body, param, check } = require("express-validator");
const Workspace = require("./workspace.model");
const UserWorkspace = require("./user_workspace.model");
const { Op } = require("sequelize");

exports.sendInvitationValidation = [
  body("role")
    .notEmpty()
    .withMessage("role is required.")
    .isIn(["admin", "member"])
    .withMessage("role must be only admin or member."),
  body("user_emails")
    .notEmpty()
    .withMessage("user_emails is required.")
    .isArray()
    .withMessage("user_emails must be an array.")
    .isEmail()
    .withMessage("user_emails must be a valid email"),
  body("workspace_id")
    .notEmpty()
    .withMessage("workspace_id is required")
    .isNumeric()
    .withMessage("workspace_id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspace_id  must be between 1 and 30 characters long"),
];
exports.acceptInvitationValidation = [
  param("hash")
    .notEmpty()
    .withMessage("hash is required")
    .isString()
    .withMessage("hash must be only string")
    .isLength({ min: 1, max: 10 })
    .withMessage("hash  must be between 1 and 10 characters long"),
];
exports.addNewWorkspaceValidation = [
  body("name")
    .notEmpty()
    .withMessage("name is required")
    .isString()
    .withMessage("name must be only string")
    .isLength({ min: 1, max: 191 })
    .withMessage("name  must be between 1 and 191 characters long"),
  check("name").custom(async (value, req) => {
    let workspace_ids = [];
    let workspaces = await UserWorkspace.findAll({
      where: { userId: +req.req.id },
      attributes: ["workspaceId"],
    });
    if (workspaces != null) {
      workspaces.map((workspace) => {
        workspace_ids.push(workspace.dataValues.workspaceId);
      });
      let old_workspace = await Workspace.findOne({
        where: {
          name: value,
          id: {
            [Op.in]: workspace_ids,
          },
        },
      });
      if (old_workspace != null) {
        return Promise.reject("workspace already in use try another name");
      }
    }
  }),
  body("avatar")
    .notEmpty()
    .withMessage("avatar is required")
    .isString()
    .withMessage("avatar must be only string"),
  body("file_name")
    .optional()
    .isString()
    .withMessage("file_name must be only string"),
  body("employee_num")
    .optional()
    .isString()
    .withMessage("employee_num must be only string")
    .isLength({ min: 1, max: 191 })
    .withMessage("employee_num  must be between 1 and 191 characters long"),
  body("industry")
    .optional()
    .isString()
    .withMessage("industry must be only string")
    .isLength({ min: 1, max: 191 })
    .withMessage("industry  must be between 1 and 191 characters long"),
  body("owner_role")
    .optional()
    .isString()
    .withMessage("owner_role must be only string")
    .isLength({ min: 1, max: 191 })
    .withMessage("owner_role  must be between 1 and 191 characters long"),
];

exports.validateParamsID = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspace id must be between 1 and 30 characters long"),
];

exports.validateUpdateUserRole = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("User Invitation id must be between 1 and 30 characters long"),
  body("workspaceId")
    .notEmpty()
    .withMessage("workspaceId is required")
    .isNumeric()
    .withMessage("workspaceId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspaceId must be between 1 and 30 characters long"),
  body("role")
    .notEmpty()
    .withMessage("role is Required")
    .isString()
    .withMessage("role must be A String")
    .isIn(["admin", "member"])
    .withMessage("role must be an admin or member"),
];

exports.validateUpdateUserRole = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("User Invitation id must be between 1 and 30 characters long"),
  body("workspaceId")
    .notEmpty()
    .withMessage("workspaceId is required")
    .isNumeric()
    .withMessage("workspaceId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspaceId must be between 1 and 30 characters long"),
  body("role")
    .notEmpty()
    .withMessage("role is Required")
    .isString()
    .withMessage("role must be A String")
    .isIn(["admin", "member"])
    .withMessage("role must be an admin or member"),
];

exports.validateWorksapceId = [
  body("workspaceId")
    .notEmpty()
    .withMessage("workspaceId is required")
    .isNumeric()
    .withMessage("workspaceId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspaceId must be between 1 and 30 characters long")
];


exports.validateUpdateWorkspaceById = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("User Invitation id must be between 1 and 30 characters long"),
  body("name")
    .optional()
    .isString()
    .withMessage("name must be only string")
    .isLength({ min: 1, max: 191 })
    .withMessage("name  must be between 1 and 191 characters long"),
  check("name").optional().custom(async (value, req) => {
    let workspace_ids = [];
    let workspaces = await UserWorkspace.findAll({
      where: { userId: +req.req.id },
      attributes: ["workspaceId"],
    });
    if (workspaces != null) {
      workspaces.map((workspace) => {
        workspace_ids.push(workspace.dataValues.workspaceId);
      });
      let old_workspace = await Workspace.findOne({
        where: {
          name: value,
          id: {
            [Op.in]: workspace_ids,
          },
        },
      });
      if (old_workspace != null) {
        return Promise.reject("workspace already in use try another name");
      }
    }
  }),
  body("avatar")
    .optional()
    .isString()
    .withMessage("avatar must be only string"),
  body("file_name")
    .optional()
    .isString()
    .withMessage("file_name must be only string"),
];