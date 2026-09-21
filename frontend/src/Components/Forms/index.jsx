import CreateRoomForm from "./CreateRoomForms";
import JoinRoomForm from "./JoinRoomForm";
import "./index.css";

const Forms = ({ uuid, socket, setUser }) => {
  return (
    <div className="home-container fade-in">
      <div className="home-content">
        <header className="home-header">
          <h1 className="logo-title">
            <span className="logo-icon">✨</span>
            CollabBoard
          </h1>
          <p className="subtitle">Real-time collaborative whiteboard for modern teams.</p>
        </header>

        <div className="forms-wrapper">
          <div className="form-card glass">
            <div className="card-header">
              <h2>Create a Room</h2>
              <p>Start a new session and invite others</p>
            </div>
            <CreateRoomForm uuid={uuid} socket={socket} setUser={setUser} />
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="form-card glass">
            <div className="card-header">
              <h2>Join a Room</h2>
              <p>Enter an existing room code</p>
            </div>
            <JoinRoomForm uuid={uuid} socket={socket} setUser={setUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forms;
