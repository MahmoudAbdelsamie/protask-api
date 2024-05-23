const express = require("express");
const router = express.Router();
const subtaskController = require("./subtask.controller");
const config = require("../../config/middlewares");
const { createSubtaskValidation , updateSubtaskValidation , validateParamsID} = require("./subtask.validation");

router
  .route("/subtask")
  .post(config.auth , createSubtaskValidation ,config.mwError, subtaskController.createNewSubtask);

  router
  .route("/subtask/:id")
  .get(config.auth , validateParamsID, config.mwError, subtaskController.getSubtaskById);


  router
  .route("/subtask/:id")
  .put(config.auth, updateSubtaskValidation , validateParamsID ,  config.mwError, subtaskController.updateSubtask);

  router
  .route("/subtask/:id")
  .delete(config.auth , validateParamsID ,config.mwError, subtaskController.deleteSubtask);

module.exports = router;
