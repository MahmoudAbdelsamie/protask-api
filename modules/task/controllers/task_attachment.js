const Task_attach = require("../models/task_attachs");
const fs = require("fs");
const imgMw = require("../../../middlewares/imageMW");

exports.deleteOneAttachment = async (req, res, next) => {
  try {
    const task_attach_id = req.params.id;
    const attachment = await Task_attach.findByPk(task_attach_id);

    if (!attachment) {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "Attachment not found to delete or is already deleted",
      });
    }

    const ex = attachment.extension === "pdf" ? "files" : "images";
    const filePath = `${process.cwd()}/public/${ex}/tasks/${attachment.name}`;

    fs.unlink(`${filePath}`, (err) => {
      if (err) {
        throw new Error("File doesn't exist, won't remove it. ");
      }
    });
    attachment.destroy();

    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status_code: 500,
      data: null,
      message: "Internal server error",
    });
  }
};

exports.updateOneAttachment = async (req, res, next) => {
  try {
    const task_attach_id = req.params.id;
    const name = req.body.name;
    const attachment = await Task_attach.findByPk(task_attach_id);
    if (!attachment) {
      return res.status(404).json({
        status_code: 404,
        data: null,
        message: "Attachment not found to update!",
      });
    }
    try {
      if (name) {
        const task_path =
          process.cwd() +
          `/public/${attachment.extension == "pdf" ? "files" : "images"}/tasks`;
        let new_name;
        new_name = name.trim();
        new_name = name.replaceAll(" ", "_"); 
        let ex_length = attachment.extension.length; 
        let currentDate = `-${(new Date().getTime() / 1000) | 0}`; 
        let indexPosition = new_name.length - ex_length - 1;
        new_name =
          new_name.slice(0, indexPosition) +
          currentDate +
          new_name.slice(indexPosition);
        fs.rename(
          task_path + `/${attachment.name}`,
          task_path + `/${new_name}`,
          function (err) {
            if (err) console.log("ERROR: " + err);
          }
        );
        await attachment.update({
          name: new_name,
        });
        return res.status(200).json({
          status_code: 200,
          data: null,
          message: "Attachment updated successfully",
        });
      }
      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "you have update nothing",
      });
    } catch (err) {
      res.status(500).json({
        status_code: 500,
        data: null,
        message: "Internal server error while update " + err,
      });
    }
  } catch (error) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: "Internal server error " + err,
    });
  }
};

exports.addNewAttachment = async (req, res, next) => {
  try {
    const { attatchments, filesnames, taskId } = req.body;
    if (attatchments && filesnames) {
      let task_attachs = imgMw.uploadFilesAndPdf(
        attatchments,
        filesnames,
        "tasks"
      );
      task_attachs.map(async (attachment_obj, i) => {
        await Task_attach.create({
          taskId: taskId,
          name: attachment_obj.fileName,
          extension: attachment_obj.extension,
        });
      });
      return res.status(200).json({
        status_code: 200,
        data: null,
        message: "attachment added sucessfully",
      });
    }
  } catch (err) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: "Internal server error " + err,
    });
  }
};
