const express = require("express");
const router = express.Router();
const config = require("../../../config/middlewares");
const taskController = require("../controllers/task");
const dependencyController = require("../controllers/task_depenedency");
const attachmentController = require("../controllers/task_attachment");
const {
  createTaskValidation,
  validateParamsID,
  validateAttachmentsUpdate,
  validateAddNewAttachment,
  validateAddNewDependency,
  validateTasksListParamsID,
  validateUpdateTask,
  validateUpdateTaskOrder,
} = require("../validations/task");

router
  .route("/add-task")
  .post(
    config.auth,
    createTaskValidation,
    config.mwError,
    taskController.addNewTask
  );
router
  .route("/task/:id")
  .all(config.auth, validateParamsID, config.mwError)
  .get(taskController.getTaskById)
  .put(validateUpdateTask, config.mwError, taskController.updateTaskByID)
  .delete(taskController.deleteOneTaskById);

router
  .route("/space-tasks/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    taskController.getAllTaskLists
  );

router
  .route("/update-task-order")
  .put(
    config.auth,
    validateUpdateTaskOrder,
    config.mwError,
    taskController.updateTaskOrder
  );

// task attachments

router
  .route("/attachment/:id")
  .all(config.auth, validateParamsID, config.mwError)
  .delete(attachmentController.deleteOneAttachment)
  .put(
    validateAttachmentsUpdate,
    config.mwError,
    attachmentController.updateOneAttachment
  );
router
  .route("/new-task-attachment")
  .post(
    config.auth,
    validateAddNewAttachment,
    config.mwError,
    attachmentController.addNewwAttachment
  );

// task dependencies
router
  .route("/new-task-dependency")
  .post(
    config.auth,
    validateAddNewDependency,
    config.mwError,
    dependencyController.addNewDependency
  );
router
  .route("/dependency/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    dependencyController.deleteOneDependency
  );

router
  .route("/list-of-tasks/:id")
  .get(
    config.auth,
    validateTasksListParamsID,
    config.mwError,
    taskController.getListOfTasks
  );

router
  .route("/tasks/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    taskController.getAllTasksWithStatusByListId
  );

module.exports = router;
