import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

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
      rooms.get(currentRoom).users.delete(currentUser);

      // Notify everyone in the old room with the updated user list
      io.to(currentRoom).emit(
        "userJoined",
        Array.from(rooms.get(currentRoom).users) // Convert Set to Array for sending
      );
    }

    // Update the current room and user for this socket
    currentRoom = roomId;
    currentUser = userName;

    // Join the new room
    socket.join(roomId);

    // If this room does not exist in the Map, create a new Set for users
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {users: new Set() , code: "// start code here" ,language : "javascript"});
    }

    // Add the current user to the room's user list
    rooms.get(roomId).users.add(userName);

    socket.emit("codeUpdate" , rooms.get(roomId).code);
    socket.emit("languageUpdate", rooms.get(roomId).language);

    // Notify everyone in the new room about the updated user list
    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom).users));

    // console.log('user :', userName );
    // console.log('rooomId ', roomId);
  });

  socket.on("codeChange", ({ roomId, code }) => {
    if(rooms.has(roomId)){
      rooms.get(roomId).code = code;
    }
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));

      socket.leave(currentRoom);

      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    if(rooms.has(roomId)){
      rooms.get(roomId).language = language;
    }
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("compileCode", async ({ code, roomId, language , input }) => {
  if (!rooms.has(roomId)) return;
  const room = rooms.get(roomId);
  try {
    
    const runtimes = [
      {
        "language": "javascript",
        "version": "18.15.0",
        "aliases": [
            "node-javascript",
            "node-js",
            "javascript",
            "js"
        ],
        "runtime": "node"
    },
    {
        "language": "java",
        "version": "15.0.2",
        "aliases": []
    },
    {
        "language": "c++",
        "version": "10.2.0",
        "aliases": [
            "cpp",
            "g++"
        ],
        "runtime": "gcc"
    },
    {
        "language": "python",
        "version": "3.10.0",
        "aliases": [
            "py",
            "py3",
            "python3",
            "python3.10"
        ]
    },

    ] // array of { language, version, aliases, ... }

    // 2. Validate incoming language/version (case-sensitive for version, language usually lowercase)
    const normalizedLang = language.toLowerCase();
    const valid = runtimes.find(
      (r) => r.language === normalizedLang 
    );
    if (!valid) {
      // socket.emit("codeError", {
      //   message: `Unsupported runtime: ${language}-${version}`,
      //   availableVersions: runtimes
      //     .filter((r) => r.language === normalizedLang)
      //     .map((r) => r.version),
      // });
      return;
    }

    // 3. Execute using the validated runtime
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: valid.language,
        version: valid.version,
        files: [{ content: code }],
        stdin:input,
      },
      { timeout: 10000 }
    );
    // console.log('req made');
    const output = response?.data?.run?.output ?? "no output";
    room.output = output;
    // console.log(output)
    io.to(roomId).emit("codeResponse", response.data);
  } catch (err) {
    console.error("compileCode error:", err);
    // socket.emit("codeError", {
    //   message: "Compilation failed.",
    //   detail: err.message,
    // });
  }
});


  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).users.delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom).users));
    }
    // console.log("user disconnected!");
  });
});

app.get("/", (req, res) => {
  res.send("server is running");
});
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`server started on ${port}`);
});
