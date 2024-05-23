const config = require("../../config/middlewares");
const bcrypt = require("bcrypt");
const User = require("./user.model");
const imgMw = require("../../middlewares/imageMW");
const Email_invitations = require("../workspace/emails_invitations.model");
const UserWorkspace = require("../workspace/user_workspace.model");
// const Users_path = 
// const usersPath = 
// const workspaces_path = 
const jwt = require("jsonwebtoken");
const emailMw = require("../../middlewares/send_emails");
const fs = require("fs");
const Workspace = require("../workspace/workspace.model");

exports.createNewUser = async (req, res, next) => {
  const { name, email, password, avatar, file_name, hash } = req.body;
  let avatarObj;
  try {
    await bcrypt.hash(password, 10).then(async (hashedPass) => {
      if (avatar) {
        avatarObj = imgMw.uploadFilesAndPdf(avatar, file_name, "users");
      }
      let user = await User.create({
        name: name,
        email: email,
        password: hashedPass,
        avatar: avatar ? avatarObj[0].fileName : "defaultUser.png",
      });
      if (user == null) {
        throw new Error("internal server err while create user");
      } else {
        const user_id = user.dataValues.id;
        const user_email = user.dataValues.email;
        const user_name = user.dataValues.name;
        const user_avatar = user.dataValues.avatar;


        if (hash) {
          let invitation = await Email_invitations.findOne({
            where: {
              email: email,
              is_active: 1,
              hash: hash,
              status: "pending",
            },
          });
          if (invitation != null) {
            const { workspace_id, role } = invitation.dataValues;
            await UserWorkspace.create({
              user_role: role,
              is_owner: 0,
              is_active: 1,
              userId: user_id,
              workspaceId: workspace_id,
            });
            invitation.update({
              status: "accepted",
            });
          }
        }

        let token;
        token = jwt.sign(
          {
            id: user_id,
            name: user_name,
            email: user_email,
            avatar: user_avatar,
          },
          process.env.secret,
          { expiresIn: "1d" }
        );

        let workspaces_data = await config.findWorkspaces(user_id, false);
        let active_workspace = await config.findWorkspaces(user_id, true);

        return res.status(200).json({
          status_code: 200,
          data: {
            user: {
              id: user_id,
              name: user_name,
              email: user_email,
              avatar: Users_path + user_avatar,
              has_workspace: user.dataValues.has_workspace,
            },
            token,
            active_workspace_id: active_workspace.workspaces[0]
              ? active_workspace.workspaces[0].id
              : null,
            workspaces: workspaces_data.workspaces,
          },
          message: "user created successfully",
        });
      }
    });
  } catch (err) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: err.message });
  }
};

exports.forgetPassword = async (req, res, next) => {
  const email = req.body.email;
  try {
    let user = await User.findOne({
      where: {
        email: email,
      },
    });
    if (user != null) {
      let hashed = config.generateRandomString();
      let currentDate = new Date();
      let expire_date = currentDate.setMinutes(currentDate.getMinutes() + 120);
      const subject = "reset password pm-camp";
      const message = "reset password";
      dynamicData = {
        expiration_date: expire_date,
        email: email,
        logo: `${process.env.SERVER_FRONT_HOST}/assets/email/logo.png`,
        icon: `${process.env.SERVER_FRONT_HOST}/public/images/email-template/reset_password.png`,
        hash: `${process.env.SERVER_FRONT_HOST}/login/password/reset/${hashed}`,
        subject,
        message,
      };

      info = await emailMw.sendEmail("reset", email, dynamicData);

      let success = config.myCash
        .getMyCash()
        .set(
          `${hashed}`,
          { hash: hashed, expire_date: expire_date, email: email },
          7200
        );
      console.log("suuuu ", success, "your hash is ==> ", hashed);

      return res.status(200).json({
        status_code: 200,
        message: "message sent successfully",
        data: null,
      });
    } else throw new Error("email address does not exist!");
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, message: error.message, data: null });
  }
};

exports.checkForgetHash = async (req, res, next) => {
  const hash = req.params.hash;
  const { password, confirm_password } = req.body;
  try {
    let current_date = new Date();
    let hashed_obj = config.myCash.getMyCash().get(`${hash}`);
    if (hashed_obj && hashed_obj.expire_date > current_date) {
      const email = hashed_obj.email;
      let user_obj = await User.findOne({
        where: {
          email: email,
        },
      });
      if (user_obj != null) {
        if (password != undefined && confirm_password != undefined) {
          if (password == confirm_password) {
            await bcrypt.hash(password, 10).then(async (hashedPass) => {
              await user_obj.update({
                password: hashedPass,
              });
            });
            config.myCash.getMyCash().del(hash);
            res.status(200).json({
              status_code: 200,
              data: null,
              message: "password updated successfully",
            });
          }
        } else {
          throw new Error("password and confirm password does not match");
        }


      } else {
        throw new Error("internal server error ");
      }
    }

    else {
      console.log("expired");
      throw new Error("hash is expired!");
    }
  } catch (error) {
    res
      .status(500)
      .json({ status_code: 500, data: null, message: error.message });
  }
};

exports.getUserInfoForSettings = async (req, res) => {
  try {
    const id = +req.id;
    const user = await User.findOne({
      where: {
        id: id,
      },
      attributes: ["id", "name", "email", "avatar"],
    });
    if (user != null) {
      let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      extensions.map((extension) => {
        if (user.dataValues.avatar.includes(extension)) {
          user.dataValues.avatar = `${Users_path}${user.dataValues.avatar}`;
        }
      });

      return res.status(200).json({
        status_code: 200,
        data: user,
        message: "Ok",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "User Not found",
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

exports.updateUserAccount = async (req, res) => {
  try {
    const { name, email, file_name } = req.body;
    let avatar = req.body.avatar;
    const id = +req.id;

    const user = await User.findByPk(id);
    if (user != null) {
      let oldAvatar = user.dataValues.avatar;
      let isImage = false;
      if (avatar && file_name) {
        let avatarObj = imgMw.uploadFilesAndPdf(avatar, file_name, "users");
        avatar = avatarObj[0].fileName;
      }
      await user.update({
        name: name,
        email: email,
        avatar: avatar,
      });
      let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      extensions.map((extension) => {
        if (oldAvatar.includes(extension)) {
          isImage = true;
        }
      });
      if (isImage) {
        imagePath = `${usersPath}${oldAvatar}`;
        fs.unlink(imagePath, (error) => {
          if (error) {
            throw new Error(error);
          }
        });
      }
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
      message: "Internal Server Error",
    });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const id = +req.id;
    const user = await User.findByPk(id);
    if (user != null) {
      let oldAvatar = user.dataValues.avatar;
      let isImage = false;
      let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      extensions.map((extension) => {
        if (oldAvatar.includes(extension)) {
          isImage = true;
        }
      });
      if (isImage) {
        imagePath = `${usersPath}${oldAvatar}`;
        fs.unlink(imagePath, (error) => {
          if (error) {
            throw new Error(error);
          }
        });
      }
      await user.destroy();
      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "Ok",
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

exports.updateUserPassword = async (req, res) => {
  try {
    const id = +req.id;
    const user = await User.findByPk(id);
    const { originalPassword, newPassword } = req.body;
    if (user != null) {
      const userPassword = user.password;
      bcrypt.compare(originalPassword, userPassword).then(async (isEqual) => {
        if (!isEqual) {
          return res.status(400).json({
            status_code: 400,
            data: null,
            message: "Incorrect Password",
          });
        }
        await bcrypt.hash(newPassword, 10).then(async (hashedPass) => {
          await user.update({
            password: hashedPass,
          });
          return res.status(200).json({
            status_code: 200,
            data: null,
            message: "Password Updated Successfully",
          });
        });
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

exports.getUserWorkspaces = async (req, res) => {
  try {
    const userId = +req.id;
    const workspaces = await User.findByPk(userId, {
      attributes: [],
      include: [
        {
          model: Workspace,
          attributes: ["id", "name", "avatar"],
          through: {
            model: UserWorkspace,
            attributes: ["is_owner"],
            required: false,
          },
        },
      ],
    });
    if (workspaces != null) {
      let ownerWorkspaces = [],
        otherWorkspaces = [];
      workspaces.workspaces.forEach((workspace) => {
        let extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
        extensions.map((extension) => {
          if (workspace.avatar.includes(extension)) {
            workspace.avatar = `${workspaces_path}${workspace.avatar}`;
          }
        });
        workspace.user_workspaces.is_owner
          ? ownerWorkspaces.push(workspace)
          : otherWorkspaces.push(workspace);
        delete workspace.user_workspaces.dataValues;
      });

      const allWorkspaces = {
        ownerWorkspaces,
        otherWorkspaces,
      };
      return res.status(200).json({
        status_code: 200,
        data: allWorkspaces,
        message: "Ok",
      });
    } else {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "Workspaces Not found",
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
