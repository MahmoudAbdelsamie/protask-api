const Email_invitations = require("./emails_invitations.model");
const Workspace = require("./workspace.model");
const User = require("../user/user.model");
const config = require("../../config/middlewares");
// const Users_path = 
const not_found_msg = "Invitation not found!";
const emailMw = require("../../middlewares/send_emails");
const UserWorkspace = require("./user_workspace.model");
let forbidden_msg = "You are forbidden to invite users to this workspace ";
// const workspace_path =


let userSocket = config.io.getUserSocket();
function getSocketIdByEmail(email) {
  return userSocket.get(email) || null;
}

function hasExpired(expirationDate) {
  return Date.now() > new Date(expirationDate);
}

async function updateInvitationStatus(email_invitation, status) {
  await email_invitation.update({
    status: status,
  });
}

async function findInvitationByHash(hash) {
  const email_invitation = await Email_invitations.findOne({
    where: {
      hash: hash,
    },
  });
  if (email_invitation == null) {
    throw new Error(not_found_msg);
  }
  return email_invitation;
}

module.exports.sendInvitationToUsers = async (req, res, next) => {
  const { workspace_id, user_emails, role } = req.body;
  try {
    const is_admin = await UserWorkspace.findOne({
      where: {
        userId: +req.id,
        user_role: "admin",
        workspaceId: workspace_id,
      },
    });
    if (is_admin != null) {
      const inviteWorkspace = await Workspace.findOne({
        where: {
          id: workspace_id,
        },
      });
      let dynamicData = {},
        info,
        hashed;
      const subject = "you have invited to workspace at warcamp";
      const message = "send invitation";
      const emailsPromises = await user_emails.map(async (email) => {
        hashed = config.generateRandomString();
        dynamicData = {
          username: req.name,
          workspace: inviteWorkspace.name,
          email: email,
          icon: `${process.env.SERVER_FRONT_HOST}/assets/email/envelop.png`,
          logo: `${process.env.SERVER_FRONT_HOST}/assets/email/logo.png`,
          hashedEmail: `${process.env.SERVER_FRONT_HOST}/invite/${hashed}`,
          role: role,
          subject,
          message,
        };

        let newDate = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000);
        let expire_date = JSON.stringify(newDate);
        let old_invitation = await Email_invitations.findOne({
          where: {
            email,
            workspace_id,
          },
        });
        let email_invitation;
        if (old_invitation != null) {
          old_invitation.expire_date = expire_date;
          old_invitation.role = role;
          old_invitation.save();
        } else {
          email_invitation = await Email_invitations.create({
            email,
            role,
            hash: hashed,
            workspace_id,
            expire_date: expire_date,
            status: "pending",
            is_active: 0,
            userId: +req.id,
          });
        }
        info = await emailMw.sendEmail("invite", email, dynamicData);
        if (email_invitation != null) {
          let socketId = getSocketIdByEmail(email);

          let io = config.io.getIO();
          console.log(socketId);
          io.to(socketId).emit("notify", {
            message: `${req.name} invited you to ${inviteWorkspace.name}`,
            avatar: Users_path + req.avatar,
          });
          const notification_obj = {
            notificationParentType: "invite",
            notificationParentId: email_invitation.id,
            is_read: false,
            senderId: +req.id,
            type: "invite",
            workspace_id: null,
          };
          await config.addNewNotification(email, notification_obj);
        }
        return info;
      });
      const emailResults = await Promise.all(emailsPromises);
      const rejectedEmails = emailResults.reduce((acc, result) => {
        return acc.concat(result.rejected);
      }, []);
      if (rejectedEmails.length > 0) {
        return res.status(400).json({
          status_code: 400,
          data: rejectedEmails,
          message: "Some email invitations were rejected..",
        });
      } else {

        return res.status(200).json({
          status_code: 200,
          data: null,
          message: "invitations send successfully",
        });
      }
    } else {
      throw new Error(forbidden_msg);
    }
  } catch (error) {
    let status = error.message == forbidden_msg ? 403 : 500;
    res.status(status).json({
      status_code: status,
      data: null,
      message: error.message,
    });
  }
};


module.exports.validateAndAcceptInvitations = async (req, res, next) => {
  const hash = req.params.hash;
  try {
    const email_invitation = await findInvitationByHash(hash);
    let email_expiration = email_invitation.expire_date;
    if (hasExpired(email_expiration.replace(/"|'/g, ""))) {
      await updateInvitationStatus(email_invitation, "expired");
      return res.status(410).json({
        status_code: 410,
        data: null,
        message: "invitation is expired !",
      });
    }
    const { email, workspace_id, role, status } = email_invitation.dataValues;
    if (status == "pending") {

      email_invitation.update({
        is_active: 1,
      });

      let user = await User.findOne({
        where: {
          email: email,
        },
      });
      if (user == null) {
        console.log("you should register first");
      } else {
        console.log("hello you are a in");
        const activeWorkspace = await UserWorkspace.findOne({
          where: {
            userId: user.dataValues.id,
            is_active: 1,
          },
        });
        if (activeWorkspace != null) {
          await activeWorkspace.update({
            is_active: 0,
          });
        }
        await UserWorkspace.create({
          user_role: role,
          is_owner: 0,
          is_active: 1,
          userId: user.dataValues.id,
          workspaceId: workspace_id,
        });

        let acceptedWorkspace = await Workspace.findByPk(workspace_id);
        let imagesEx = [".png", ".jpeg", ".jpg", ".webp", ".svg", ".gif"];
        let acceptedAvatar;
        imagesEx.map((ex) => {
          if (acceptedWorkspace.avatar.includes(ex)) {
            acceptedAvatar = workspace_path + acceptedWorkspace.avatar;
          }
        });
        console.log("test", acceptedWorkspace);
        let io = config.io.getIO();

        let socketId = await getSocketIdByEmail(email);
        if (socketId != null) {
          await io.to(socketId).emit("workSpacesNewItem", {
            data: {
              id: acceptedWorkspace.id,
              name: acceptedWorkspace.name,
              avatar: acceptedAvatar,
            },
          });
        }

        await updateInvitationStatus(email_invitation, "accepted");
      }
    }
    res.status(200).json({
      status_code: 200,
      data: {
        workspace_id: workspace_id,
      },
      message: "ok",
    });
  } catch (error) {
    let status = error.message == not_found_msg ? 404 : 500;
    res.status(status).json({
      status_code: status,
      data: null,
      message: error.message,
    });
  }
};

module.exports.declineInvitation = async (req, res, next) => {
  const hash = req.params.hash;
  try {
    const email_invitation = await findInvitationByHash(hash);
    let email_expiration = email_invitation.expire_date;
    if (hasExpired(email_expiration.replace(/"|'/g, ""))) {
      await updateInvitationStatus(email_invitation, "expired");
      return res.status(200).json({
        status_code: 410,
        data: null,
        message: "invitation is expired !",
      });
    }
    const { status } = email_invitation.dataValues;
    if (status == "pending") {
      email_invitation.update({
        is_active: 1,
      });
      await updateInvitationStatus(email_invitation, "declined");
    }
    res.status(200).json({
      status_code: 200,
      data: null,
      message: "Invitation has been Declined",
    });
  } catch (error) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};
