/**
 * User Management — In-memory user tracking
 * 
 * Each user: { name, userId, roomId, host, presenter, socketId }
 */

const users = [];

const addUser = ({ name, userId, roomId, host, presenter, socketId }) => {
  // Update existing user if re-joining (e.g. page refresh)
  const existingIndex = users.findIndex((u) => u.userId === userId);
  if (existingIndex !== -1) {
    users[existingIndex] = { name, userId, roomId, host, presenter, socketId };
    return users[existingIndex];
  }

  const user = { name, userId, roomId, host, presenter, socketId };
  users.push(user);
  return user;
};

const removeUser = (socketId) => {
  const index = users.findIndex((u) => u.socketId === socketId);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
  return null;
};

const getUser = (userId) => {
  return users.find((u) => u.userId === userId);
};

const getUserBySocketId = (socketId) => {
  return users.find((u) => u.socketId === socketId);
};

const getUsersInRoom = (roomId) => {
  return users.filter((u) => u.roomId === roomId);
};

const removeAllUsersInRoom = (roomId) => {
  let i = users.length;
  while (i--) {
    if (users[i].roomId === roomId) {
      users.splice(i, 1);
    }
  }
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUserBySocketId,
  getUsersInRoom,
  removeAllUsersInRoom,
};