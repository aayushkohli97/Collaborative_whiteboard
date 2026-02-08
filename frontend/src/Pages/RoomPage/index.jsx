import { useState } from "react";
import "./index.css";

const RoomPage = () => {
    const [activeTool, setActiveTool] = useState("pencil");
    
    const toggleTheme = () => {
        document.body.classList.toggle("dark");
    };

    return (
        <div className="room-container">

            {/* Header */}
            <div className="room-header">
                <div>
                    <h2>Whiteboard Sharing App</h2>
                    <span className="room-id">Room ID: ABC123</span>
                </div>

                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={toggleTheme}
                >
                    Toggle Theme
                </button>
            </div>

            {/* Main Content */}
            <div className="room-body">

                {/* Whiteboard Area */}
                <div className="whiteboard-container">

                    {/* Toolbar */}
                    <div className="toolbar">
                        <button
                            className={`tool-btn ${activeTool === "pencil" ? "active" : ""}`}
                            onClick={() => setActiveTool("pencil")}
                        >
                            ✏️ Pencil
                        </button>

                        <button
                            className={`tool-btn ${activeTool === "pen" ? "active" : ""}`}
                            onClick={() => setActiveTool("pen")}
                        >
                            🖊️ Pen
                        </button>

                        <button
                            className={`tool-btn ${activeTool === "brush" ? "active" : ""}`}
                            onClick={() => setActiveTool("brush")}
                        >
                            🖌️ Brush
                        </button>

                        <button
                            className={`tool-btn eraser ${activeTool === "eraser" ? "active" : ""}`}
                            onClick={() => setActiveTool("eraser")}
                        >
                            🧽 Eraser
                        </button>

                        <input type="color" className="color-picker" />
                    </div>

                    {/* Writing Area */}
                    <div className="whiteboard">
                        <p className="placeholder-text">
                            
                            (Draw / Write here)
                        </p>
                    </div>
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
