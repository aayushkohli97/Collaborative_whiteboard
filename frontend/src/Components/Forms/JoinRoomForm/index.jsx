import { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinRoomForm = ({ uuid, socket, setUser }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter your name");
    if (!roomId.trim()) return alert("Please enter a room code");

    const roomData = {
      name: name.trim(),
      roomId: roomId.trim(),
      userId: uuid(),
      host: false,
      presenter: false,
    };

    localStorage.setItem("user", JSON.stringify(roomData));
    setUser(roomData);

    socket.emit("userJoined", roomData);
    navigate(`/${roomData.roomId}`);
  };

  return (
    <form className="form-content" onSubmit={handleJoinRoom}>
      <div className="form-group">
        <label className="form-label">Your Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group" style={{ marginBottom: '2.5rem' }}>
        <label className="form-label">Room Code</label>
        <input
          type="text"
          className="form-input"
          placeholder="Enter room code to join"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn-primary">
        Join Room
      </button>
    </form>
  );
};

export default JoinRoomForm;