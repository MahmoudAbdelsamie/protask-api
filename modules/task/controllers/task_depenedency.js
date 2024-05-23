const Task_dependency = require("../models/task_dependency");

exports.addNewDependency = async (req, res, next) => {
  try {
    const { dependencies, taskId } = req.body;
    dependencies.map((dependency) => {
      dependency.dependencies_tasks.map((tasks_ids) => {
        Task_dependency.create({
          status: dependency.status,
          taskId: taskId,
          dependencyId: tasks_ids, 
        });
      });
    });
    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "task dependencies added sucessfully",
    });
  } catch (err) {
    res.status(500).json({
      status_code: 500,
      data: null,
      message: "Internal server error " + err,
    });
  }
};

exports.deleteOneDependency = async (req, res, next) => {
  try {
    const dependencyId = req.params.id;
    console.log("dependencie id  ", dependencyId);
    const dependencyObj = await Task_dependency.findByPk(dependencyId);
    if (!dependencyObj) {
      throw new Error("dependency not found to delete or is already deleted!");
    }
    dependencyObj.destroy();
    return res.status(200).json({
      status_code: 200,
      data: null,
      message: "dependency deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      status_code: 500,
      data: null,
      message: error.message,
    });
  }
};
