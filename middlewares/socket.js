const { Server } = require("socket.io");
let io;
let usersSocketMap = new Map();


module.exports = {
  init: (httpServer) => {
    console.log("test socket");
    io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    return io;
  }, 
  getIO: () => {
    if (!io) {
      throw new Error("socket.io not initialized");
    }
    return io;
  },
  getUserSocket:()=>{
    return usersSocketMap
  },
  storeSocketId:(userEmail , socketId)=>{
    if (!usersSocketMap.has(userEmail)) {
      usersSocketMap.set(userEmail, []);   
    }
    usersSocketMap.get(userEmail).push(socketId);
  },
  handleSwichRooms:(socket , roomName , currentRoom)=>{
    if (currentRoom) {
      socket.leave(currentRoom);
      console.log(`Socket ${socket.id} left room ${currentRoom}`);
    }
     socket.join(roomName);
     currentRoom = roomName;
     console.log(`Socket ${socket.id} joined room ${currentRoom}`);
    return currentRoom;
  },

  getEmailsBySocketId:(socketId)=>{
    for (const [email, socketIds] of usersSocketMap.entries()) {
      if (socketIds.includes(socketId)) {
        return email;
      }
    }
    return null;
  },
};


