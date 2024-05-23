const { body, check, param } = require("express-validator");
const Tag = require("../models/tag");
exports.tagValidationAdd = [
  body("name")
    .notEmpty()
    .withMessage("Tag name is required")
    .isString()
    .withMessage("Tag name must be a string")
    .isLength({ max: 191 })
    .withMessage("Tag name must be less than 191 characters long"),
  check("name").custom((value) => {
    return Tag.findOne({ where: { name: value } }).then((tag) => {
      if (tag) {
        return Promise.reject("Tag name already in use");
      }
    });
  }),
  body("color")
    .optional()
    .isString()
    .withMessage("Tag color must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),

  body("workspaceId")
    .notEmpty()
    .withMessage("workspaceId is required")
    .isNumeric()
    .withMessage("workspaceId must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("workspaceId must be between 3 and 30 characters long"),
];

exports.tagValidationUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage("Tag name must be a string")
    .isLength({ max: 191 })
    .withMessage("Tag name must be less than 191 characters long"),
  check("name")
    .optional()
    .custom((value) => {
      value ? value : "";
      console.log(value);
      if (value != undefined) {
        return Tag.findOne({ where: { name: value } }).then((tag) => {
          if (tag) {
            return Promise.reject("Tag name already in use");
          }
        });
      } else {
        return;
      }
    }),
  body("color")
    .optional()
    .isString()
    .withMessage("Tag color must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isNumeric()
    .withMessage("id must be a number")
    .isLength({ min: 1, max: 30 })
    .withMessage("space id must be between 3 and 30 characters long"),
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
