
const Space = require("../modules/space/space.model");
const User = require("../modules/user/user.model");
const Task = require("../modules/task/models/task");
const UserSpace = require("../modules/space/user_space.model");
const Subtask = require("../modules/subtask/subtask.model");
const User_subtask = require("../modules/subtask/user_subtask.model");
const User_task = require("../modules/task/models/user_task");
const Task_tag = require("../modules/task/models/task_tag");
const Tag = require("../modules/task/models/tag");
const Task_attach = require("../modules/task/models/task_attachs");
const Task_dependency = require("../modules/task/models/task_dependency");
const Status = require("../modules/task/models/status");
const UserWorkspace = require("../modules/workspace/user_workspace.model");
const Workspace = require("../modules/workspace/workspace.model");
const invitaion = require("../modules/workspace/emails_invitations.model");
const listStatusOrder = require("../modules/task/models/list_status_order");
const Invite = require("../modules/workspace/emails_invitations.model");

invitaion.hasMany(Notification, {
  foreignKey: "notificationParentId",
  constraints: false,
  scope: {
    notificationParentType: "invite",
  },
});
Notification.belongsTo(invitaion, {
  foreignKey: "notificationParentId",
  constraints: false,
});
// association between workspace and invitations
Workspace.hasMany(invitaion, {
  foreignKey: "workspace_id",
});
invitaion.belongsTo(Workspace, {
  foreignKey: "workspace_id",
});

Task.hasMany(Notification, {
  foreignKey: "notificationParentId",
  constraints: false,
  scope: {
    notificationParentType: "task",
  },
});
Notification.belongsTo(Task, {
  foreignKey: "notificationParentId",
  constraints: false,
});

Workspace.hasMany(Notification, { foreignKey: { allowNull: true } });
Notification.belongsTo(Workspace, { foreignKey: { allowNull: true } });

Notification.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});
Notification.belongsTo(User, {
  foreignKey: "recieverId",
  as: "reciever",
});

User.hasMany(Notification, {
  foreignKey: "recieverId",
  as: "reciever",
});

User.hasMany(Notification, {
  foreignKey: "senderId",
  as: "sender",
});

// space and folder relation
Space.hasMany(Notification, {
  foreignKey: "notificationParentId",
  constraints: false,
  scope: {
    notificationParentType: "space",
  },
});
Notification.belongsTo(Space, {
  foreignKey: "notificationParentId",
  constraints: false,
});

Space.hasMany(Folder, { constraints: false });
Folder.belongsTo(Space, { constraints: false });

User.belongsToMany(Workspace, { through: UserWorkspace });
Workspace.belongsToMany(User, { through: UserWorkspace });

Workspace.hasMany(Space);
Space.belongsTo(Workspace);
// space and invitations

// add invited by to invites model
User.hasMany(Invite, { foreignKey: "userId" });
Invite.belongsTo(User, {
  foreignKey: "userId",
});

User.hasMany(Whiteboard);
Whiteboard.belongsTo(User);

List.hasMany(Whiteboard);
Whiteboard.belongsTo(List);

User.hasMany(Docs);
Docs.belongsTo(User);

List.hasMany(Docs);
Docs.belongsTo(List);

Workspace.hasMany(Tag);
Tag.belongsTo(Workspace);

Space.hasMany(Invitation);
Invitation.belongsTo(Space);

// user_space relation
User.belongsToMany(Space, { through: UserSpace });
Space.belongsToMany(User, { through: UserSpace });

// polymerphi aassociation  favorites  list and space and folder

// polymerphic association between list and space and folder
Space.hasMany(List, {
  foreignKey: "listParentId",
  constraints: false,
  scope: {
    listParentType: "space",
  },
});
List.belongsTo(Space, { foreignKey: "listParentId", constraints: false });

Folder.hasMany(List, {
  foreignKey: "listParentId",
  constraints: false,
  scope: {
    listParentType: "folder",
  },
});
List.belongsTo(Folder, { foreignKey: "listParentId", constraints: false });

// task and list relation
List.hasMany(Task);

List.hasOne(listStatusOrder);
listStatusOrder.belongsTo(List);

// polymerphic association between Link and space, list and task

Space.hasOne(Link, {
  foreignKey: "linkParentId",
  scope: {
    linkParentType: "space",
  },
});
Link.belongsTo(Space, { foreignKey: "linkParentId" });
// list and link
List.hasOne(Link, {
  foreignKey: "linkParentId",
  scope: {
    linkParentType: "List",
  },
});
Link.belongsTo(List, { foreignKey: "linkParentId" });
// task and link
Task.hasOne(Link, {
  foreignKey: "linkParentId",
  scope: {
    linkParentType: "Task",
  },
});
Link.belongsTo(Task, { foreignKey: "linkParentId" });

// relation between task and subtask
Task.hasMany(Subtask, {
  // foreignKey: "taskId",
  onDelete: "CASCADE",
});
Subtask.belongsTo(Task, {
  // foreignKey: "taskId",
  onDelete: "CASCADE",
});

// relation between task and attachs
Task.hasMany(Task_attach);
Task_attach.belongsTo(Task);

// relation between user and task
User.belongsToMany(Task, { through: User_task });
Task.belongsToMany(User, { through: User_task });

User.hasMany(Task, { foreignKey: "userID", as: "taskOwner" });
Task.belongsTo(User, {
  foreignKey: "userID",
  as: "taskOwner",
});

// task and tags relation
Tag.belongsToMany(Task, { through: Task_tag });
Task.belongsToMany(Tag, { through: Task_tag });

User.hasMany(Tag);
Tag.belongsTo(User);

// relation between user and subtask
User.belongsToMany(Subtask, { through: User_subtask });
Subtask.belongsToMany(User, { through: User_subtask });

// polymerphic association between task, subtask and comment
Task.hasMany(Comment, {
  foreignKey: "commentParentId",
  constraints: false,
  scope: {
    commentParentType: "task",
  },
});
Comment.belongsTo(Task, { foreignKey: "commentParentId", constraints: false });

Subtask.hasMany(Comment, {
  foreignKey: "commentParentId",
  constraints: false,

  scope: {
    commentParentType: "subtask",
  },
});
Comment.belongsTo(Subtask, {
  foreignKey: "commentParentId",
  constraints: false,
});

// relation between comment and attachs
Comment.hasMany(Comment_attach);
Comment_attach.belongsTo(Comment);

// relation between comment and mention
Comment.hasMany(Mention);
Mention.belongsTo(Comment);

// relation between comment and user
User.hasMany(Comment);
Comment.belongsTo(User);

Comment.hasMany(Like);
Like.belongsTo(Comment);

User.hasMany(Like);
Like.belongsTo(User);
// user and mention relation
User.hasMany(Mention);
Mention.belongsTo(User);

// relation between user and checklist
User.belongsToMany(checklistItems, { through: User_checklist });
checklistItems.belongsToMany(User, { through: User_checklist });

Checklist.hasMany(checklistItems);
checklistItems.belongsTo(Checklist);

User.hasMany(Checklist);
Checklist.belongsTo(User);

// polymerphic association between  task , subtask and checklist
Task.hasMany(Checklist, {
  foreignKey: "checklistParentId",
  constraints: false,
  scope: {
    checklistParentType: "task",
  },
});
Checklist.belongsTo(Task, {
  foreignKey: "checklistParentId",
  constraints: false,
});

Subtask.hasMany(Checklist, {
  foreignKey: "checklistParentId",
  constraints: false,
  scope: {
    checklistParentType: "subtask",
  },
});
Checklist.belongsTo(Subtask, {
  foreignKey: "checklistParentId",
  constraints: false,
});

// task and task dependancy relation
Task_dependency.belongsTo(Task, {
  foreignKey: "dependencyId",
  as: "dependency", // dependencyId alias
});

Task_dependency.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task", // taskId alias
});

Task.hasMany(Task_dependency, {
  foreignKey: "dependencyId",
  as: "dependentTasks",
});

Task.hasMany(Task_dependency, {
  foreignKey: "taskId",
  as: "taskDependencies",
});

// task and status relation

Status.hasMany(Task);
Task.belongsTo(Status);

Status.hasMany(Subtask);
Subtask.belongsTo(Status);

// status and list

List.hasMany(Status);

Status.belongsTo(List);

// polymerphic association between favorites, spaces,lists and tasks.
Space.hasMany(Favourite, {
  foreignKey: "favouriteParentId",
  // constraints: false,
  scope: {
    favouriteParentType: "space",
  },
});
Favourite.belongsTo(Space, { foreignKey: "favouriteParentId" });

List.hasMany(Favourite, {
  foreignKey: "favouriteParentId",
  // constraints: false,
  scope: {
    favouriteParentType: "List",
  },
});
Favourite.belongsTo(List, { foreignKey: "favouriteParentId" });

Task.hasMany(Favourite, {
  foreignKey: "favouriteParentId",
  // constraints: false,
  scope: {
    favouriteParentType: "Task",
  },
});
Favourite.belongsTo(Task, { foreignKey: "favouriteParentId" });

// relation between favorites and users
User.hasMany(Favourite);
Favourite.belongsTo(User);
