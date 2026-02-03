import "./index.css";

const RoomPage = () => {
    return (
        <div className="room-container">

            {/* Header */}
            <div className="room-header">
                <h2>Whiteboard Sharing App</h2>
                <span className="room-id">Room ID: ABC123</span>
            </div>

            {/* Main Content */}
            <div className="room-body">

                {/* Whiteboard Area */}
                <div className="whiteboard">
                    <p className="placeholder-text">
                        Whiteboard Area <br />
                        (Draw / Write here)
                    </p>
                </div>

                {/* Sidebar */}
                <div className="sidebar">
                    <h5>Participants</h5>
                    <ul className="user-list">
                        <li>🟢 You</li>
                        <li>🟢 User 2</li>
                        <li>🔴 User 3</li>
                    </ul>

                    <div className="controls">
                        <button className="btn btn-primary">Clear Board</button>
                        <button className="btn btn-outline-danger">Leave Room</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RoomPage;
