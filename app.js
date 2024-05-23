const sequelize = require("./config/database");
const config = require("./config/middlewares");
const express = require("express");
const { createServer } = require("http");
const server = express();
const httpServer = createServer(server);
const modelAssociations = require("./config/models_associations");
const path = require("path");
require("dotenv").config();
const cors = require("cors");
const routes = require("./config/routes");
const jwt = require("jsonwebtoken");
const {
  getOneSpaceByIdToDuplicate,
  sendSpaceReview,
  validateSpaceName,
} = require("./modules/space/space.controller");

sequelize
  // .sync({ force: true })
  // .sync({ alter: true })
  .sync()
  .then(() => {
    console.log("Database Connected ");
    httpServer.listen(process.env.port || 5000, () => {
      config.myCash.init(); 
      console.log("Server 5000 is listening");
    });
  })
  .catch((error) => {
    console.log("DataBase connection error" + error);
  });

server.use(cors({}));

server.get("/", (req, res) => {
  res.send("<h1>Welocome to ProTask</i></h1>");
});


let io = config.io.init(httpServer);

let userSocket = config.io.getUserSocket();
io.on("connection", (socket) => {
  let currentRoom = null;

  console.log("connected====>", socket.id);
  if (socket.handshake.query.token != "null") {
    config.io.storeSocketId(
      jwt.decode(socket.handshake.query.token).email,
      socket.id
    );
    console.log("stored connections", socket.id, userSocket);
  }

  socket.on("joinWorkspaceRoom", (workspaceId) => {
    const roomName = `workspace_${workspaceId}`;
    currentRoom = config.io.handleSwichRooms(socket, roomName, currentRoom);
  });

  socket.on("getProjectDetails", (projectId) => {
    config.getProjectModelById(socket, projectId);
  });

  socket.on("getSpaceReview", (data) => {
    console.log("test", data);
    sendSpaceReview(socket, data);
  });


  socket.on("validateSpaceName", (name) => {
    console.log("test", name);
    validateSpaceName(socket, name);
  });

  socket.on("getSpaceDetails", (spaceId) => {
    console.log("space", spaceId);
    getOneSpaceByIdToDuplicate(socket, spaceId);
  });


  socket.on("disconnect", () => {
    config.removeSocketId(socket.id, userSocket);
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      }
    });
  });
});


server.use([
  express.json({ limit: "50mb" }),
  express.urlencoded({ extended: false, limit: "50mb" }),
]);

server.use([
  routes.userRoute,
  routes.loginRoute,
  routes.spaceRoute,
  routes.tagRoute,
  routes.statusRoute,
  routes.taskRoute,
  routes.subtaskRoute,
  routes.workspaceRoute,
]);


server.use((req, res) => {
  res.status(404).json({ message: "Endpoint Not Found!" });
});


server.use((error, req, res) => {
  let status = error.status || 500;
  res.status(status).json({ message: "internal error " + error });
});
