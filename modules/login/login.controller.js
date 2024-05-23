const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../user/user.model");
const config = require("../../config/middlewares");

module.exports.login = async (req, res, next) => {
  let remember = req.body.remember_me;
  try {
    let user = await User.findOne({ where: { email: req.body.email } });
    if (user) {
      bycrypt
        .compare(req.body.password, user.password)
        .then(async (isEqual) => {
          if (!isEqual) {
            res.status(400).json({
              status_code: 400,
              data: null,
              message: "invalid email or password",
            });
          } else {
            let token;
            let expire_date = remember == 1 ? "30d" : "1d";
            token = jwt.sign(
              {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
              },
              process.env.secret,
              { expiresIn: expire_date }
            );
            let workspaces_data = await config.findWorkspaces(user.id, false);
            let active_workspace = await config.findWorkspaces(user.id, true);
            return res.status(200).json({
              status_code: 200,
              data: {
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                  has_workspace: user.has_workspace,
                },
                token,
                active_workspace_id: active_workspace.workspaces[0]
                  ? active_workspace.workspaces[0].id
                  : null,
                workspaces: workspaces_data.workspaces,
              },
              message: "login success",
            });
          }
        });
    } else {
      res.status(400).json({
        status_code: 400,
        data: null,
        message: "invalid email or password",
      });
    }
  } catch (error) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};
