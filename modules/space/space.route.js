const express = require("express");
const router = express.Router();
const spaceController = require("./space.controller");
const config = require("../../config/middlewares");
const {
  spaceValidationAdd,
  updateSpaceValidation,
  validateParamsID,
  validateCustomDuplication,
  validateDuplicationName,
} = require("./space.validation");

router.route("/spaces").get(config.auth, spaceController.getAllSpaces);

router
  .route("/new-space")
  .post(
    config.auth,
    spaceValidationAdd,
    config.mwError,
    spaceController.addNewSpace
  );
router
  .route("/space/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    spaceController.getOneSpaceById
  )
  .put(
    config.auth,
    updateSpaceValidation,
    config.mwError,
    spaceController.updateOneSpace
  )
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    spaceController.deleteOneSpace
  );
router
  .route("/space-users/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    spaceController.getSpaceUsers
  );

router
  .route("/spaces-list/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    spaceController.listSpacesByWorkspaceId
  );

router
  .route("/space-list")
  .get(config.auth, config.mwError, spaceController.getSpceList);

router
  .route("/space-details/:id")
  .get(config.auth, config.mwError, spaceController.getOneSpaceByIdToDuplicate);

router
  .route("/duplicate-custom/:id")
  .post(
    config.auth,
    validateDuplicationName,
    validateCustomDuplication,
    config.mwError,
    spaceController.duplicateCustom
  );

router.route("/duplicate-All/:id").post(
  config.auth,
  validateDuplicationName,
  config.mwError,

  spaceController.duplicateAll
);
module.exports = router;
