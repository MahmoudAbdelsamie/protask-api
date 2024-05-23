const express = require("express");
const router = express.Router();
const workspaceController = require("./workspace.controller");
const emailsInvController = require("./emails_invitations.controller");
const config = require("../../config/middlewares");
const {
  sendInvitationValidation,
  validateParamsID,
  acceptInvitationValidation,
  addNewWorkspaceValidation,
  validateUpdateUserRole,
  validateUpdateWorkspaceById
} = require("./workspace.validation");

router
  .route("/add-new-workspace")
  .post(
    config.auth,
    addNewWorkspaceValidation,
    config.mwError,
    workspaceController.createNewWorkspace
  );

router
  .route("/my-workspaces")
  .get(config.auth, workspaceController.getAllUserWorkspaces);

router
  .route("/workspace/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.getOneWorkSpaceById
  );


router
  .route("/roles-list")
  .get(config.auth, workspaceController.getListOfOwnerRules);
router
  .route("/industries-list")
  .get(config.auth, workspaceController.getListOfIndustries);
router
  .route("/employees-num-list")
  .get(config.auth, workspaceController.getListOfEmployeeNumber);


router
  .route("/send-invitations")
  .post(
    config.auth,
    sendInvitationValidation,
    config.mwError,
    emailsInvController.sendInvitationToUsers
  );
router
  .route("/accept-invitation/:hash")
  .post(
    acceptInvitationValidation,
    config.mwError,
    emailsInvController.validateAndAcceptInvitations
  );

router
  .route("/decline/:hash")
  .post(
    acceptInvitationValidation,
    config.mwError,
    emailsInvController.declineInvitation
  );
router
  .route("/workspace-users/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.getWorkspaceUsers
  );


// SETTINGS

router
  .route("/workspace/settings/:id")
  .get(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.getWorkspaceSettings
  );

router
  .route("/workspace/settings/delete-user-invitation/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.deleteUserInvitation
  );

router
  .route("/workspace/settings/delete-user/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.deleteAcceptedUser
  );

router
  .route("/workspace/settings/update-user-role/:id")
  .put(
    config.auth,
    validateUpdateUserRole,
    config.mwError,
    workspaceController.updateUserRole
  );

router
  .route("/workspace/settings/resend-invitation/:id")
  .put(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.resendInvitationToUser
  );

router
  .route("/leave-workspace/:id")
  .delete(
    config.auth,
    validateParamsID,
    config.mwError,
    workspaceController.deleteUserWorkspace
  );

router
    .route("/update-workspace/:id")
    .put(
      config.auth,
      validateUpdateWorkspaceById,
      config.mwError,
      workspaceController.updateWorkspaceById
    )

router
    .route("/user-spaces/:id")
    .get(
      config.auth,
      validateParamsID,
      config.mwError,
      workspaceController.getAllUserSpaces
    )

module.exports = router;
