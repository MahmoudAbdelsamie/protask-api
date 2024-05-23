const { body, check, param } = require("express-validator");
const Status = require("../models/status");
const { Op } = require("sequelize");

exports.statusValidationAdd = [
  body("name")
    .notEmpty()
    .withMessage("Status name is required")
    .isString()
    .withMessage("Status name must be a string")
    .isLength({ max: 191 })
    .withMessage("Status name must be less than 191 characters long"),
  check("name").custom(async (value, req) => {
    return await Status.findOne({
      where: {
        name: value,
        listId: { [Op.or]: [+req.req.body.list_id, { [Op.is]: null }] },
      },
    }).then((status) => {
      if (status) {
        return Promise.reject("status name already in use in this list");
      }
    });
  }),

  body("color")
    .optional()
    .isString()
    .withMessage("status color must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),
  body("list_id")
    .notEmpty()
    .isNumeric()
    .withMessage("list id  must be a number")
    .isLength({ max: 191 })
    .withMessage("list id must be less than 191 characters long"),
  body("category")
    .optional()
    .isString()
    .withMessage("status category must be a string")
    .isLength({ max: 191 })
    .withMessage("color must be less than 191 characters long"),
];

exports.statusValidationUpdate = [
  body("name")
    .optional()
    .isString()
    .withMessage("status name must be a string")
    .isLength({ max: 191 })
    .withMessage("status name must be less than 191 characters long"),

  check("name")
    .optional()
    .custom((value, req) => {
      return Status.findOne({
        where: {
          name: value,
          listId: { [Op.or]: [+req.req.body.listId, { [Op.is]: null }] },
        },
      }).then((status) => {
        if (status) {
          if (status.dataValues.id !== +req.req.params.id) {
            return Promise.reject("status name already in use in this list");
          }
        }
      });
    }),

  body("color")
    .optional()
    .isString()
    .withMessage("Status color must be a string")
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
