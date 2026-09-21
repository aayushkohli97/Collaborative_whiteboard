import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateRoomForm = ({ uuid, socket, setUser }) => {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter your name");
    if (!roomId) return alert("Please generate a room code first");

    const roomData = {
      name: name.trim(),
      roomId,
      roomTitle: roomTitle.trim() || "Untitled Room",
      userId: uuid(),
      host: true,
      presenter: true,
    };

    localStorage.setItem("user", JSON.stringify(roomData));
    setUser(roomData);

    socket.emit("userJoined", roomData);
    navigate(`/${roomId}`);
  };

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <form className="form-content" onSubmit={handleCreateRoom}>
      <div className="form-group">
        <label className="form-label">Your Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Room Title (Optional)</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Team Brainstorming"
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Room Code</label>
        <div className="input-row">
          <input
            type="text"
            className="form-input"
            value={roomId}
            disabled
            placeholder="Generate code →"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setRoomId(uuid())}
            title="Generate New Code"
          >
            🔄
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopy}
            disabled={!roomId}
            title="Copy Code"
          >
            {copySuccess ? "✅" : "📋"}
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
        Create & Join Room
      </button>
    </form>
  );
};

export default CreateRoomForm;