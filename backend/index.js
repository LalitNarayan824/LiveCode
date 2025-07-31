

import express from "express";
import http from "http";
import { Server } from "socket.io";






const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://livecode-m9q7.onrender.com",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  // This event triggers whenever a new client connects to the server
  // console.log('user connected', socket.id);

  // Keep track of which room this socket is in and the username
  let currentRoom = null;
  let currentUser = null;

  // Listen for the "join" event when a user wants to join a room
  socket.on("join", ({ roomId, userName }) => {
    // If the user was already in a room, remove them from that room first
    if (currentRoom) {
      socket.leave(currentRoom); // Remove socket from the previous room

      // Remove the user from that room's user list (Set)
      rooms.get(currentRoom).delete(currentUser);

      // Notify everyone in the old room with the updated user list
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom)) // Convert Set to Array for sending
      );
    }

    // Update the current room and user for this socket
    currentRoom = roomId;
    currentUser = userName;

    // Join the new room
    socket.join(roomId);

    // If this room does not exist in the Map, create a new Set for users
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    // Add the current user to the room's user list
    rooms.get(roomId).add(userName);

    // Notify everyone in the new room about the updated user list
    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));

    // console.log('user :', userName );
    // console.log('rooomId ', roomId);
  });

  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", ()=>{
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      socket.leave(currentRoom);

      currentRoom= null;
      currentUser=null;
    }
  })

  socket.on("typing" , ({roomId , userName})=>{
    socket.to(roomId).emit("userTyping" , userName);
  })

  socket.on("languageChange", ({roomId , language})=>{
    io.to(roomId).emit("languageUpdate", language);
  })

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("user disconnected!");
  });
});

app.get("/", (req, res)=>{
  res.send("server is running");
})
const port = process.env.PORT || 5000;



server.listen(port, () => {
  console.log(`server started on ${port}`);
});
