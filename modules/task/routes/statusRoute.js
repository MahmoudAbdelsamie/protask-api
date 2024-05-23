const express = require("express");
const router = express.Router();
const tagController = require("../controllers/status");
const config = require("../../../config/middlewares");
const {
  statusValidationUpdate,
  statusValidationAdd,
  validateParamsID,
} = require("../validations/status");

router
  .route("/status")
  .post(
    config.auth,
    statusValidationAdd,
    config.mwError,
    tagController.createNewStatus
  );

router
  .route("/status/:id")
  .put(
    config.auth,
    statusValidationUpdate,
    config.mwError,
    tagController.updateStatus
  );

router
  .route("/orderStatus")
  .put(config.auth, config.mwError, tagController.orderStatus);

router
  .route("/status/:id")
  .get(config.auth, config.mwError, tagController.getAllStatusbyListId);

router
  .route("/status/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    tagController.deleteStatus
  );

module.exports = router;
