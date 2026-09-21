/**
 * Room Manager — Centralized room state management
 * 
 * Each room stores:
 *  - title: string
 *  - pages: Array of stroke arrays (each page = array of stroke objects)
 *  - currentPage: number (presenter's active page index)
 *  - chatEnabled: boolean (presenter toggle)
 *  - chatMessages: Array of {userId, name, text, timestamp}
 *  - presenter: {userId, name, socketId}
 *  - createdAt: timestamp
 */

const rooms = {};

// ─── Room CRUD ───────────────────────────────────────────

const createRoom = (roomId, { title = "Untitled Room", presenter }) => {
  rooms[roomId] = {
    title,
    pages: [[]], // Start with one empty page
    currentPage: 0,
    chatEnabled: true,
    chatMessages: [],
    presenter, // { userId, name, socketId }
    createdAt: Date.now(),
  };
  return rooms[roomId];
};

const getRoom = (roomId) => rooms[roomId] || null;

const deleteRoom = (roomId) => {
  delete rooms[roomId];
};

const roomExists = (roomId) => !!rooms[roomId];

// ─── Page Management ────────────────────────────────────

const addPage = (roomId) => {
  const room = rooms[roomId];
  if (!room) return null;
  room.pages.push([]);
  room.currentPage = room.pages.length - 1;
  return { pageIndex: room.currentPage, totalPages: room.pages.length };
};

const clearPage = (roomId, pageIndex) => {
  const room = rooms[roomId];
  if (!room || !room.pages[pageIndex]) return false;
  room.pages[pageIndex] = [];
  return true;
};

const getPageCount = (roomId) => {
  const room = rooms[roomId];
  return room ? room.pages.length : 0;
};

// ─── Stroke Management ──────────────────────────────────

/**
 * Add a complete stroke to a page.
 * stroke: { type: 'stroke', tool, color, size, points: [{x, y}, ...] }
 */
const addStroke = (roomId, pageIndex, stroke) => {
  const room = rooms[roomId];
  if (!room || !room.pages[pageIndex]) return false;
  room.pages[pageIndex].push(stroke);
  return true;
};

/**
 * Add a clear action to a page (for undo history purposes).
 */
const addClearAction = (roomId, pageIndex) => {
  const room = rooms[roomId];
  if (!room || !room.pages[pageIndex]) return false;
  room.pages[pageIndex].push({ type: "clear" });
  return true;
};

// ─── Chat Management ────────────────────────────────────

const addChatMessage = (roomId, message) => {
  const room = rooms[roomId];
  if (!room) return false;
  room.chatMessages.push({
    ...message,
    timestamp: Date.now(),
  });
  // Keep last 500 messages to prevent unbounded growth
  if (room.chatMessages.length > 500) {
    room.chatMessages = room.chatMessages.slice(-500);
  }
  return true;
};

const toggleChat = (roomId, enabled) => {
  const room = rooms[roomId];
  if (!room) return false;
  room.chatEnabled = enabled;
  return true;
};

// ─── State Snapshot (for late-joiners) ───────────────────

const getRoomSnapshot = (roomId) => {
  const room = rooms[roomId];
  if (!room) return null;
  return {
    title: room.title,
    pages: room.pages,
    currentPage: room.currentPage,
    chatEnabled: room.chatEnabled,
    chatMessages: room.chatMessages,
    presenter: { userId: room.presenter.userId, name: room.presenter.name },
  };
};

// ─── Debug / Metrics ─────────────────────────────────────

const getActiveRoomCount = () => Object.keys(rooms).length;

const getRoomStats = (roomId) => {
  const room = rooms[roomId];
  if (!room) return null;
  let totalStrokes = 0;
  for (const page of room.pages) {
    totalStrokes += page.filter((a) => a.type === "stroke").length;
  }
  return {
    title: room.title,
    pageCount: room.pages.length,
    totalStrokes,
    chatMessageCount: room.chatMessages.length,
    createdAt: room.createdAt,
    ageMinutes: Math.round((Date.now() - room.createdAt) / 60000),
  };
};

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  roomExists,
  addPage,
  clearPage,
  getPageCount,
  addStroke,
  addClearAction,
  addChatMessage,
  toggleChat,
  getRoomSnapshot,
  getActiveRoomCount,
  getRoomStats,
};
