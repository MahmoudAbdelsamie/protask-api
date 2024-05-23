const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tag");
const config = require("../../../config/middlewares");
const {
  tagValidationAdd,
  tagValidationUpdate,
  validateParamsID,
} = require("../validations/tag");

router
  .route("/tags")
  .post(
    config.auth,
    tagValidationAdd,
    config.mwError,
    tagController.createNewTag
  );

router
  .route("/tags/:id")
  .put(
    config.auth,
    tagValidationUpdate,
    config.mwError,
    tagController.updateTag
  );

router
  .route("/tags/:id")
  .get(config.auth, config.mwError, tagController.getAllTags);

router
  .route("/tags/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    tagController.deleteTag
  );

module.exports = router;
