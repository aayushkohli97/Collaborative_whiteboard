import io from "socket.io-client";
import "./App.css";
import Forms from "./Components/Forms";
import { Route, Routes } from "react-router-dom";
import RoomPage from "./Pages/RoomPage";
import { useEffect, useState } from "react";

const server = "http://localhost:5000";

const connectionOptions = {
  forceNew: true,
  reconnectionAttempts: Infinity,
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const handleJoined = (data) => {
      if (data.success) {
        console.log("✅ User joined successfully");
      } else {
        console.error("❌ User join error");
      }
    };

    socket.on("userIsJoined", handleJoined);

    return () => {
      socket.off("userIsJoined", handleJoined);
    };
  }, []);

  const uuid = () => {
    const s4 = () =>
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  };

  return (
    <div className="app-container">
      <Routes>
        <Route
          path="/"
          element={
            <Forms uuid={uuid} socket={socket} setUser={setUser} />
          }
        />
        <Route
          path="/:roomId"
          element={<RoomPage user={user} socket={socket} />}
        />
      </Routes>
    </div>
  );
};

export default App;