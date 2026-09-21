const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const {
  addUser,
  removeUser,
  getUserBySocketId,
  getUsersInRoom,
  removeAllUsersInRoom,
} = require("./utils/users");

const {
  createRoom,
  getRoom,
  deleteRoom,
  roomExists,
  addPage,
  clearPage,
  addStroke,
  addChatMessage,
  toggleChat,
  getRoomSnapshot,
  getActiveRoomCount,
} = require("./utils/roomManager");

// ─── Express Setup ──────────────────────────────────────

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Production: limit payload size for safety
  maxHttpBufferSize: 1e6, // 1MB max per message
});

app.get("/", (req, res) => {
  const roomCount = getActiveRoomCount();
  res.json({
    status: "running",
    activeRooms: roomCount,
    uptime: process.uptime(),
  });
});

// ─── Socket.IO Event Handling ───────────────────────────

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ── User Join ──────────────────────────────────────────

  socket.on("userJoined", (data) => {
    const { name, userId, roomId, host, presenter, roomTitle } = data;

    socket.join(roomId);
    socket.userId = userId;
    socket.roomId = roomId;

    const user = addUser({
      name,
      userId,
      roomId,
      host,
      presenter,
      socketId: socket.id,
    });

    // If presenter is creating the room, initialize room state
    if (presenter && !roomExists(roomId)) {
      createRoom(roomId, {
        title: roomTitle || "Untitled Room",
        presenter: { userId, name, socketId: socket.id },
      });
      console.log(`[Room] Created: ${roomId} by ${name}`);
    }

    // If room exists, update presenter's socketId (in case of reconnect)
    const room = getRoom(roomId);
    if (room && presenter) {
      room.presenter = { userId, name, socketId: socket.id };
    }

    // Broadcast updated user list to everyone in room
    const roomUsers = getUsersInRoom(roomId);
    io.to(roomId).emit("roomUsers", {
      users: roomUsers,
      count: roomUsers.length,
    });

    // Confirm join to the requester
    socket.emit("userIsJoined", { success: true, user });

    // Send full room state to newly joined user (fixes late-joiner blank screen)
    if (room) {
      socket.emit("sync-initial-state", getRoomSnapshot(roomId));
    }

    console.log(
      `[Room] ${name} joined ${roomId} (${roomUsers.length} users)`
    );
  });

  // ── Drawing: Stroke-Based Protocol ─────────────────────
  // Instead of sending entire canvas as base64 on every mousemove,
  // we send normalized stroke vectors (a few bytes per point).

  socket.on("stroke-start", (data) => {
    // data: { roomId, pageIndex, stroke: { tool, color, size, points: [{x, y}] } }
    socket.broadcast.to(data.roomId).emit("stroke-start", data);
  });

  socket.on("stroke-move", (data) => {
    // data: { roomId, pageIndex, point: {x, y} }
    socket.broadcast.to(data.roomId).emit("stroke-move", data);
  });

  socket.on("stroke-end", (data) => {
    // data: { roomId, pageIndex, stroke: { tool, color, size, points: [{x, y}, ...] } }
    // Store the completed stroke on the server for late-joiners
    const { roomId, pageIndex, stroke } = data;
    addStroke(roomId, pageIndex, stroke);
    socket.broadcast.to(data.roomId).emit("stroke-end", data);
  });

  // ── Undo/Redo: Full page state sync ───────────────────

  socket.on("undo-redo", (data) => {
    // data: { roomId, pageIndex, strokes: [...] }
    // Replace the page's strokes with the provided state
    const room = getRoom(data.roomId);
    if (room && room.pages[data.pageIndex] !== undefined) {
      room.pages[data.pageIndex] = data.strokes;
    }
    socket.broadcast.to(data.roomId).emit("undo-redo", data);
  });

  // ── Page Management ────────────────────────────────────

  socket.on("add-page", (data) => {
    const { roomId } = data;
    const result = addPage(roomId);
    if (result) {
      io.to(roomId).emit("page-added", result);
      console.log(`[Room] ${roomId}: New page ${result.pageIndex}`);
    }
  });

  socket.on("clear-page", (data) => {
    const { roomId, pageIndex } = data;
    clearPage(roomId, pageIndex);
    socket.broadcast.to(roomId).emit("clear-page", { pageIndex });
  });

  socket.on("change-page", (data) => {
    // Presenter changed their active page — sync to viewers
    const { roomId, pageIndex } = data;
    const room = getRoom(roomId);
    if (room) {
      room.currentPage = pageIndex;
    }
    socket.broadcast.to(roomId).emit("change-page", { pageIndex });
  });

  // ── Chat ──────────────────────────────────────────────

  socket.on("chat-message", (data) => {
    const { roomId, userId, name, text } = data;
    const room = getRoom(roomId);
    if (!room) return;

    // If chat is disabled, only presenter can send
    if (!room.chatEnabled) {
      if (room.presenter.userId !== userId) {
        return; // silently reject
      }
    }

    const message = { userId, name, text, timestamp: Date.now() };
    addChatMessage(roomId, message);
    io.to(roomId).emit("chat-message", message);
  });

  socket.on("chat-toggle", (data) => {
    const { roomId, enabled, userId } = data;
    const room = getRoom(roomId);
    if (!room) return;

    // Only presenter can toggle
    if (room.presenter.userId !== userId) return;

    toggleChat(roomId, enabled);
    io.to(roomId).emit("chat-toggle", { enabled });
    console.log(`[Chat] ${roomId}: Chat ${enabled ? "enabled" : "disabled"}`);
  });

  // ── End Session ────────────────────────────────────────

  socket.on("end-session", (data) => {
    const { roomId } = data;
    io.to(roomId).emit("session-ended", { roomId });
    console.log(`[Room] ${roomId}: Session ended by presenter`);

    // Clean up room after a brief delay to let clients navigate away
    setTimeout(() => {
      removeAllUsersInRoom(roomId);
      deleteRoom(roomId);
      console.log(`[Room] ${roomId}: Destroyed after session end`);
    }, 2000);
  });

  // ── Disconnect & Room Garbage Collection ───────────────

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      const { roomId, name } = user;

      // Broadcast updated user list
      const roomUsers = getUsersInRoom(roomId);
      io.to(roomId).emit("roomUsers", {
        users: roomUsers,
        count: roomUsers.length,
      });

      console.log(`[Room] ${name} left ${roomId} (${roomUsers.length} remaining)`);

      // Room Garbage Collection: if no one is left, destroy the room
      const socketRoom = io.sockets.adapter.rooms.get(roomId);
      if (!socketRoom || socketRoom.size === 0) {
        removeAllUsersInRoom(roomId);
        deleteRoom(roomId);
        console.log(`[GC] Room ${roomId}: Destroyed (empty)`);
      }
    }

    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─── Start Server ────────────────────────────────────────

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`\n🚀 Server running on http://localhost:${port}`);
  console.log(`   Socket.IO ready for connections\n`);
});