import { useState, useRef, useEffect } from "react";
import "./index.css";
import WhiteBoard from "../../Components/Whiteboard";
import { useParams } from "react-router-dom";

const RoomPage = ({user,socket}) => {
    const isPresenter = user?.presenter; 
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);

    const undoStack = useRef([]);
    const redoStack = useRef([]);

    const [tool, setTool] = useState("pencil");
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const [showSizeSlider, setShowSizeSlider] = useState(false);

    const sizeRef = useRef(null);
    const {roomId} = useParams();

    const formatRoomId = (id) =>{
        return id.slice(0,3) + "..."+ id.slice(-3);
    }

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (sizeRef.current && !sizeRef.current.contains(event.target)) {
                setShowSizeSlider(false);
            }
        };

        window.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);

    const saveState = () => {
        if (!canvasRef.current) return;
        undoStack.current.push(canvasRef.current.toDataURL());
        redoStack.current = [];
    };

    const undo = () => {
        if (undoStack.current.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;

        redoStack.current.push(canvas.toDataURL());

        const img = new Image();
        img.src = undoStack.current.pop();

        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            socket.emit("whiteboardData",{
                img : canvas.toDataURL(),
                roomId : roomId
            });
        };
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;

        undoStack.current.push(canvas.toDataURL());

        const img = new Image();
        img.src = redoStack.current.pop();

        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            socket.emit("whiteboardData",{
                img : canvas.toDataURL(),
                roomId : roomId
            });
        };
    };

    const handleClearCanvas = ()=>{
        saveState();
        const canvas= canvasRef.current;
        const ctx = ctxRef.current;
        ctx.fillStyle = "white";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        socket.emit("whiteboardData",{
            img : canvas.toDataURL(),
            roomId : roomId
        })
    }

    return (
        <div className="room-container">

            <div className="row">
                
                <div className="col-12 mb-2">
                    <h5>Room ID: {formatRoomId(roomId)} </h5>
                </div>
                
                <div className="col-md-10 mx-auto mb-3">

                    <div className={`tool-bar ${!isPresenter? "viewer-mode" : ""}`}>

                        <div className={`tool-card ${tool === "pencil" ? "active" : ""}`} onClick={() => setTool("pencil")}>
                            ✏️
                            <span>Pencil</span>
                        </div>

                        <div className={`tool-card ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")}>
                            🖊️
                            <span>Pen</span>
                        </div>

                        <div className={`tool-card ${tool === "brush" ? "active" : ""}`} onClick={() => setTool("brush")}>
                            🖌️
                            <span>Brush</span>
                        </div>

                        <div className={`tool-card ${tool === "eraser" ? "active" : ""}`} onClick={() => setTool("eraser")}>
                            🧽
                            <span>Eraser</span>
                        </div>

                        <div className="size-picker-box" ref={sizeRef}>

                            <div className="tool-card size-button" onClick={() => setShowSizeSlider(!showSizeSlider)}>
                                📏
                                <span>Size</span>
                            </div>

                            {showSizeSlider && (
                                <div className="size-slider">
                                    <input
                                        type="range"
                                        min="1"
                                        max="25"
                                        value={size}
                                        onChange={(e) => setSize(Number(e.target.value))}
                                    />
                                </div>
                            )}

                        </div>

                        <div className="color-picker-box">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                            />
                        </div>

                        <button className="action-button" onClick={undo}>↩️</button>
                        <button className="action-button" onClick={redo}>➡️</button>

                        <button
                            className="action-button clear-button"
                            onClick={handleClearCanvas}
                        >
                            clear canvas
                        </button>

                    </div>

                </div>

                <div className="col-md-10 mx-auto canvas-box">

                    <WhiteBoard
                        canvasRef={canvasRef}
                        ctxRef={ctxRef}
                        tool={tool}
                        color={color}
                        size={size}
                        saveState={saveState}
                        isPresenter={isPresenter}
                        socket={socket}
                    />

                </div>

            </div>

        </div>
    );
};

export default RoomPage;