# Collaborative Whiteboard

A real-time collaborative whiteboard application where multiple users can join a room and draw together simultaneously. The application synchronizes drawing events across all connected clients using WebSockets.

## Features

* 🎨 Real-time collaborative drawing
* 👥 Multiple users in the same room
* 🧑‍💻 Username display for connected users
* 🖊️ Drawing tools (Pencil, Brush, Eraser)
* 🎨 Color selection
* 📏 Adjustable brush size
* 🧹 Clear canvas functionality
* 📡 Live synchronization using WebSockets

---

## Tech Stack

### Frontend

* **React.js**
* **HTML5 Canvas API**
* **Tailwind CSS**
* **Socket.io Client**
* **Vite**

### Backend

* **Node.js**
* **Express.js**
* **Socket.io**

---

## How It Works

1. A user opens the application and joins a room using a unique room ID.
2. The frontend connects to the backend server using **Socket.io**.
3. When a user draws on the canvas:

   * The drawing coordinates are emitted to the server.
4. The server broadcasts the drawing data to all other users in the same room.
5. Each client renders the drawing in real time.

---

## Socket Events

### Client → Server

| Event       | Description          |
| ----------- | -------------------- |
| join-room   | User joins a room    |
| draw        | Send drawing data    |
| clear       | Clear canvas         |
| cursor-move | Send cursor position |

---

### Server → Client

| Event       | Description                |
| ----------- | -------------------------- |
| user-joined | Notify when a user joins   |
| user-left   | Notify when a user leaves  |
| draw        | Broadcast drawing event    |
| clear       | Clear canvas for all users |

---

## Future Improvements
* 🧑‍🏫 Presenter mode
* 💾 Save whiteboard as image
* 🔐 Authentication system
* 📱 Mobile support

---

---

## License

This project is licensed under the **MIT License**.
