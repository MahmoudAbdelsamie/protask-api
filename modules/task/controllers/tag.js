const Tag = require("../models/tag");

exports.createNewTag = (req, res, next) => {
  let rondomClor = Math.floor(Math.random() * 16777215).toString(16);
  const { name, color, workspaceId } = req.body;
  Tag.create({
    name: name,
    color: color ? color : "#" + rondomClor,
    userId: req.id,
    workspaceId,
  })

    .then(() => {
      res.status(200).json({
        status_code: 200,
        message: "Tag created successfully",
        data: null,
      });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status_code: 500, message: err.message, data: null });
    });
};


exports.updateTag = (req, res, next) => {
  const { name, color } = req.body;
  console.log(req.params.id);
  Tag.findByPk(req.params.id)
    .then((tag) => {
      if (tag && req.id == tag.userId) {
        tag
          .update({
            name: name,
            color: color,
          })
          .then(() => {
            res.status(200).json({
              status_code: 200,
              message: "Tag updated successfully",
              data: null,
            });
          });
      } else {
        res.status(500).json({
          status_code: 500,
          message: "Tag not found to update!",
          data: null,
        });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status_code: 500, message: err.message, data: null });
    });
};

exports.getAllTags = (req, res, next) => {
  Tag.findAll({
    attributes: ["id", "name", "color"],
    where: {
      workspaceId: req.params.id,
    },
  })
    .then((tags) => {
      res.status(200).json({ status_code: 200, message: "", data: tags });
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status_code: 500, message: err.message, data: null });
    });
};

exports.deleteTag = (req, res, next) => {
  Tag.findByPk(req.params.id)
    .then((tag) => {
      if (tag && req.id == tag.userId) {
        tag.destroy().then(() => {
          res.status(200).json({
            status_code: 200,
            message: "Tag Deleted successfully",
            data: null,
          });
        });
      } else {
        res.status(500).json({
          status_code: 500,
          message: "Tag not found to delete!",
          data: null,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        status_code: 500,
        message: "Tag not found to delete!",
        data: null,
      });
    });
};
