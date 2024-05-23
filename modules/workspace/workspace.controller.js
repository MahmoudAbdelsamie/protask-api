const { Op, Sequelize } = require("sequelize");
const Space = require("../space/space.model");
const UserSpace = require("../space/user_space.model");

const User = require("../user/user.model");
const UserWorkspace = require("./user_workspace.model");
const Workspace = require("./workspace.model");
const imgMw = require("../../middlewares/imageMW");
// const workspace_path = 
// const workspacePath = 
let forbidden_msg =
  "workspace not found or you dont have permission to access this workspaces";
// const Users_path = 
const config = require("../../config/middlewares");
const emailMw = require("../../middlewares/send_emails");
const fs = require("fs");
const Email_invitations = require("./emails_invitations.model");
const { formatDate } = require("../../middlewares/helperFuctions");

let userSocket = config.io.getUserSocket();
function getSocketIdByEmail(email) {
  return userSocket.get(email) || null;
}



module.exports.getOneWorkSpaceById = async (req, res, next) => {
  const userId = +req.id;
  const workspace_id = req.params.id;
  try {
    let data = await User.findByPk(userId, {
      attributes: [],
      include: [
        {
          model: Workspace,
          where: { id: workspace_id },
          attributes: ["id", "name", "avatar"],
          include: [
            {
              model: User,
              required: false,
              attributes: ["email"],
              through: {
                attributes: [],
                as: "user_workspace",
              },
            },
            {
              model: Space,
              attributes: ["id", "name", "color", "Icon"],
              include: [
                {
                  model: User,
                  attributes: ["id"],
                  where: { id: userId },
                  through: {
                    attributes: ["user_role"],
                    as: "user_space",
                  },
                },
                {
                  model: List,
                  required: false,
                  attributes: ["id", "name"],
                },
                {
                  model: Folder,
                  required: false,
                  attributes: ["id", "name"],
                  include: {
                    model: List,
                    required: false,
                    attributes: ["id", "name"],
                  },
                },
              ],
            },
          ],
          through: [
            {
              model: UserWorkspace,
              attributes: ["id", "is_active", "user_role"],
              required: false,
            },
          ],
        },
      ],
    });
    if (data != null) {
      let notification = await getNotificationCount(workspace_id, userId);
      let activeWorkspace = await UserWorkspace.findOne({
        where: {
          userId: userId,
          is_active: 1,
          workspaceId: { [Op.ne]: workspace_id },
        },
      });
      if (activeWorkspace) {
        await activeWorkspace.update({
          is_active: 0,
        });
      }
      let listOfUsers;
      await data.workspaces.map((workspace) => {
        listOfUsers = [];
        let imagesEx = [".png", ".jpeg", ".jpg", ".webp", ".svg", ".gif"];
        imagesEx.map((ex) => {
          if (workspace.dataValues.avatar.includes(ex)) {
            workspace.dataValues.avatar =
              workspace_path + workspace.dataValues.avatar;
          }
        });
        workspace.dataValues.users.map((userObj) => {
          listOfUsers.push(userObj.dataValues.email);
        });
        workspace.dataValues.spaces.map((space) => {
          space.dataValues.user_role =
            space.dataValues.users[0].dataValues.user_space.user_role;
          delete space.dataValues.users;
          space.dataValues.show = false;
          if (space.dataValues.folders) {
            space.dataValues.folders.map((folder) => {
              folder.dataValues.showF = false;
              folder.dataValues.opened = true;
              folder.dataValues.check = false;
              folder.dataValues.listsIds = folder.lists.map(
                (folder) => folder.id
              );
              if (folder.dataValues.lists) {
                folder.dataValues.lists.map((list) => {
                  list.dataValues.showFL = false;
                  list.dataValues.check = false;
                });
              }
            });
          }
          if (space.dataValues.lists) {
            space.dataValues.lists.map((list) => {
              list.dataValues.showL = false;
            });
          }
        });
        workspace.dataValues.user_emails = [...listOfUsers];
        workspace.user_workspaces.is_active = 1;
        workspace.user_workspaces.save();
        workspace.dataValues.is_active =
          workspace.dataValues.user_workspaces.dataValues.is_active;
        workspace.dataValues.user_role =
          workspace.dataValues.user_workspaces.dataValues.user_role;
        workspace.dataValues.notification_count =
          notification[0].dataValues.notification_count;
      });
      await data.workspaces.map((workspace) => {
        delete workspace.dataValues.users;
        delete workspace.dataValues.user_workspaces;
      });
      return res
        .status(200)
        .json({ status_code: 200, data: data.workspaces[0], message: "ok" });
    } else {
      throw new Error(forbidden_msg);
    }
  } catch (error) {
    let status = error.message == forbidden_msg ? 403 : 500;
    res
      .status(status)
      .json({ status_code: status, data: null, message: error.message });
  }
};

module.exports.getAllUserWorkspaces = (req, res, next) => {
  const userId = +req.id;
  User.findByPk(userId, {
    attributes: [],
    include: [
      {
        model: Workspace,
        attributes: ["id", "name"],
        through: {
          model: UserWorkspace,
          attributes: ["is_active"],
          required: false,
        },
      },
    ],
  })
    .then((data) => {
      data.workspaces.map((workspace) => {
        workspace.dataValues.is_active =
          workspace.dataValues.user_workspaces.dataValues.is_active;
      });
      data.workspaces.map((workspace) => {
        delete workspace.dataValues.user_workspaces;
      });
      return res
        .status(200)
        .json({ status_code: 200, data: data.workspaces, message: "ok" });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ status_code: 500, data: null, message: error.message });
    });
};


module.exports.createNewWorkspace = async (req, res, next) => {
  const { name, file_name, employee_num, industry, owner_role } = req.body;
  let avatar = req.body.avatar;
  try {
    if ((avatar != undefined) & (file_name != undefined)) {
      let avatarObj = imgMw.uploadFilesAndPdf(avatar, file_name, "workspaces");
      avatar = avatarObj[0].fileName;
    }
    let new_workspace = await Workspace.create({
      name,
      avatar,
      employee: employee_num ? employee_num : "2-5",
      industry: industry ? industry : "IT",
      owner_role: owner_role ? owner_role : "Team Leader",
    });
    if (new_workspace != null) {
      const workspace_id = new_workspace.dataValues.id;
      let active_workspace = await UserWorkspace.findOne({
        where: {
          userId: +req.id,
          is_active: 1,
        },
      });
      if (active_workspace) {
        active_workspace.update({
          is_active: 0,
        });
      }
      await UserWorkspace.create({
        user_role: "admin",
        is_owner: 1,
        is_active: 1,
        userId: +req.id,
        workspaceId: workspace_id,
      });
      let workspaceOwner = await User.findOne({
        where: {
          id: +req.id,
        },
      });
      if (workspaceOwner != null) {
        if (workspaceOwner.dataValues.has_workspace == false) {
          workspaceOwner.update({
            has_workspace: 1,
          });
        }
      }
      let workspaces_data = await config.findWorkspaces(+req.id, false);
      return res.status(200).json({
        status_code: 200,
        data: {
          workspace_id: new_workspace.id,
          workspaces: workspaces_data.workspaces,
        },
        message: "workspace created successfully",
      });
    } else throw new Error("internal server error while creating workspace");
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};

exports.getListOfOwnerRules = (req, res, next) => {
  try {
    const rules = [
      "Team Leader",
      "Business Owner",
      "Software Engineer",
      "Developer",
      "Team Member",
      "Freelancer",
      "Director",
      "C-Level",
    ];
    return res
      .status(200)
      .json({ status_code: 200, data: rules, message: "ok" });
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};
exports.getListOfIndustries = (req, res, next) => {
  try {
    const industries = [
      "IT",
      "Professional Services",
      "PMO",
      "Operations",
      "Marketing",
      "Finance",
      "HR Management",
      "Infrastructure Solutions",
      "Sales & CRM",
      "Design",
      "Personal Use",
      "Other",
    ];
    return res
      .status(200)
      .json({ status_code: 200, data: industries, message: "ok" });
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};
exports.getListOfEmployeeNumber = (req, res, next) => {
  try {
    const employees = [
      "Only me",
      "2-5",
      "6-10",
      "11-25",
      "26-50",
      "51-200",
      "201-500",
      "501+",
    ];
    return res
      .status(200)
      .json({ status_code: 200, data: employees, message: "ok" });
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};



// GET Settings

exports.getWorkspaceSettings = async (req, res) => {
  const id = req.params.id;
  try {
    let limit = req.query.rows ? +req.query.rows : 7;
    let offset = req.query.page ? (req.query.page - 1) * limit : 0;

    if (offset === 0) {
      limit = 6;
    } else {
      offset--;
    }

    const isAdminOrOwner = await UserWorkspace.findOne({
      where: {
        userId: +req.id,
        workspaceId: id,
        is_owner: true,
      },
    });

    if (!isAdminOrOwner) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message:
          "Forbidden! Only Owner and Admins can access Workspace Settings",
      });
    }
    const invitations = await Email_invitations.findAndCountAll({
      where: {
        workspace_id: id,
      },
      attributes: [
        "id",
        "email",
        "role",
        "status",
        "createdAt",
        "expire_date",
        [Sequelize.col("user.name"), "invitedBy"],
      ],
      offset: offset,
      limit: limit,
      include: [
        {
          model: User,
          attributes: [],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (invitations != null) {
      invitations.rows.map((elem) => {
        elem.dataValues.createdAt = formatDate(elem.dataValues.createdAt);
      });
    }

    if (offset === 0) {
      const owner = {
        id: "",
        email: req.email,
        status: "Owner",
        role: "Owner",
        createdAt: "",
        expire_date: "",
        invitedBy: "",
      };
      invitations.rows.unshift(owner);
    }

    invitations.count++;
    return res.status(200).json({
      status_code: 200,
      data: invitations,
      message: "OK",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: "Internal Server Error",
    });
  }
};

exports.deleteUserInvitation = async (req, res) => {
  const id = req.params.id;

  try {
    const userInvitationToDelete = await Email_invitations.findByPk(id);

    if (!userInvitationToDelete) {
      return res.status(404).json({
        status_code: 404,
        message: "User Invitation Not Found",
        data: null,
      });
    }
    let workspaceId = userInvitationToDelete.dataValues.workspace_id;
    const isAdminOrOwner = await config.isAdminOrOwner(+req.id, workspaceId);
    if (!isAdminOrOwner) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message:
          "Forbidden! Only Owner and Admins can delete this user invitation",
      });
    }

    userInvitationToDelete.destroy();

    return res.status(200).json({
      status_code: 200,
      message: "User invitation deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      message: error.message,
      data: null,
    });
  }
};

exports.deleteAcceptedUser = async (req, res) => {
  const id = req.params.id;
  let userId, userEmail, userToDelete;
  let workspaceId;
  try {
    const userInvitation = await Email_invitations.findByPk(id);
    if (userInvitation != null) {
      workspaceId = userInvitation.dataValues.workspace_id;
      const isAdminOrOwner = await config.isAdminOrOwner(+req.id, workspaceId);
      if (!isAdminOrOwner) {
        return res.status(403).json({
          status_code: 403,
          data: null,
          message: "Forbidden! Only Owner and Admins can delete this user",
        });
      }
      if (userInvitation.status != "accepted") {
        throw new Error(
          "Error! User is not Actually Accepting the invitation, you can Cancel The Invitation"
        );
      }
      userEmail = userInvitation.email;
      userToDelete = await User.findOne({
        where: {
          email: userEmail,
        },
        attributes: ["id"],
      });
      if (userToDelete != null) {
        userId = userToDelete.id;
      } else {
        throw new Error("User is not found Or is already deleted!");
      }
      const userWorkspaceToDelete = await UserWorkspace.findOne({
        where: {
          userId: userId,
          workspaceId: workspaceId,
        },
      });
      if (!userWorkspaceToDelete) {
        throw new Error("User is not exists in this workspace");
      }
      userWorkspaceToDelete.destroy();
      userInvitation.destroy();
      return res.status(200).json({
        status_code: 200,
        message: "User deleted successfully from this workspace",
        data: null,
      });
    } else {
      throw new Error(
        "User is not exists in this workspace user or have already removed "
      );
    }
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      message: error.message,
      data: null,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  const id = req.params.id;
  const { role, workspaceId } = req.body;

  try {
    const isAdminOrOwner = await config.isAdminOrOwner(+req.id, workspaceId);
    if (!isAdminOrOwner) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "Forbidden! Only Owner and Admins can delete this user",
      });
    }
    const userToUpdate = await Email_invitations.findByPk(id);
    if (userToUpdate != null) {
      userToUpdate.role = role;
      await userToUpdate.save();

      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "User Updated Successfully",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "User Not Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};

exports.resendInvitationToUser = async (req, res) => {
  const { id } = req.params;
  let workspaceId;
  try {
    const userInvitation = await Email_invitations.findOne({
      where: {
        id: id,
      },
    });
    if (userInvitation != null) {
      workspaceId = userInvitation.dataValues.workspace_id;
      const isAdminOrOwner = config.isAdminOrOwner(+req.id, workspaceId);
      if (!isAdminOrOwner) {
        return res.status(403).json({
          status_code: 403,
          data: null,
          message:
            "Forbidden! Only Owner and Admins can Resend Invitations to users",
        });
      }
      const { email, role, status } = userInvitation;
      if (status === "accepted") {
        throw new Error("User is Already Accepting the invitation!");
      }
      const inviteWorkspace = await Workspace.findOne({
        where: {
          id: workspaceId,
        },
      });
      if (inviteWorkspace != null) {
        let hashed = config.generateRandomString();
        const subject = "you have invited to workspace at warcamp";
        const message = "send invitation";
        let info;
        let dynamicData = {
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
        await Email_invitations.update(
          {
            email,
            role,
            hash: hashed,
            workspaceId,
            expire_date: expire_date,
            status: "pending",
            is_active: 0,
            userId: +req.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            where: {
              id: id,

            },
          }
        );
        info = await emailMw.sendEmail("invite", email, dynamicData);
        let socketId = getSocketIdByEmail(email);
        let io = config.io.getIO();
        console.log(socketId);
        io.to(socketId).emit("notify", {
          message: `${req.name} invited you to ${inviteWorkspace.name}`,
          avatar: Users_path + req.avatar,
        });
        const notification_obj = {
          notificationParentType: "invite",
          notificationParentId: id,
          is_read: false,
          senderId: +req.id,
          type: "invite",
          workspace_id: null,
          invitationId: userInvitation.dataValues.id,
        };
        await config.updateNotification(email, notification_obj);
      } else {
        return res.status(404).json({
          status_code: 404,
          data: null,
          message: "Workspace Not found",
        });
      }
    }
    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "invitations send successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};

exports.deleteUserWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = +req.id;
    const userWorkspace = await UserWorkspace.findOne({
      where: {
        userId: userId,
        workspaceId: workspaceId,
      },
    });
    if (userWorkspace != null) {
      await userWorkspace.destroy();
      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "you are removed Successfully",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message:
          "you are already removed from this workspace or workspace deleted",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};

exports.updateWorkspaceById = async (req, res) => {
  try {
    const userId = +req.id;
    const { id } = req.params;
    const { name, file_name } = req.body;
    let avatar = req.body.avatar;
    const isAdminOrOwner = await config.isAdminOrOwner(userId, id);
    if (!isAdminOrOwner) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "Forbidden! Only Owner and Admins can Update this Workspace",
      });
    }
    const workspace = await Workspace.findByPk(id);
    if (workspace != null) {
      let oldAvatar = workspace.dataValues.avatar;
      let isImage = false;
      if (avatar && file_name) {
        let avatarObj = imgMw.uploadFilesAndPdf(
          avatar,
          file_name,
          "workspaces"
        );
        avatar = avatarObj[0].fileName;
      }
      await workspace.update({
        name: name,
        avatar: avatar,
      });
      let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      extensions.map((extension) => {
        if (oldAvatar.includes(extension)) {
          isImage = true;
        }
      });
      if (isImage) {
        imagePath = `${workspacePath}${oldAvatar}`;
        fs.unlink(imagePath, (error) => {
          if (error) {
            throw new Error(error);
          }
        });
      }
      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "Ok",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "Workspace Not Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};

exports.getAllUserSpaces = async (req, res) => {
  try {
    const userId = +req.id;
    const { id } = req.params;
    let limit = req.query.rows ? +req.query.rows : 7;
    let offset = req.query.page ? (req.query.page - 1) * limit : 0;
    const isAdminOrOwner = await config.isAdminOrOwner(userId, id);
    if (!isAdminOrOwner) {
      return res.status(403).json({
        status_code: 403,
        data: null,
        message: "Forbidden! Only Owner and Admins can view this resources",
      });
    }

    const spaces = await Space.findAndCountAll({
      where: {
        workspaceId: id,
      },
      attributes: ["id", "name", "color", "Icon"],
      offset: offset,
      limit: limit,
      include: [
        {
          model: User,
          attributes: ["id", "name", "email", "avatar"],
          through: {
            model: UserSpace,
            attributes: ["is_owner"],
          },
        },
      ],
    });
    if (spaces != null) {
      const count = await Space.count({
        where: {
          workspaceId: id,
        },
      });
      spaces.count = count;
      spaces.rows.map((space) => {
        let owner;
        const users = space.dataValues.users.filter((user) => {
          let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
          extensions.map((extension) => {
            if (user.dataValues.avatar.includes(extension)) {
              user.dataValues.avatar = `${Users_path}${user.dataValues.avatar}`;
            }
          });
          if (user.user_spaces && user.user_spaces.dataValues.is_owner) {
            owner = user.name;
            return false;
          }
          delete user.user_spaces.dataValues;
          return true;
        });
        space.dataValues.users = users;
        space.dataValues.owner = owner;
      });
      return res.status(200).json({
        status_code: 200,
        data: spaces,
        message: "Ok",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "Spaces Not Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};
