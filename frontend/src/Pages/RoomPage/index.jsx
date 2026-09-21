import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./index.css";
import WhiteBoard from "../../Components/Whiteboard";
import Chat from "../../Components/Chat";
import { exportToPdf } from "../../utils/pdfExport";
import { useTheme } from "../../context/ThemeProvider";

const RoomPage = ({ user, socket }) => {
  const isPresenter = user?.presenter;
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // ─── Room State ──────────────────────────────────────────────
  const [roomTitle, setRoomTitle] = useState("Loading...");
  const [pages, setPages] = useState([[]]); // Array of stroke arrays
  const [currentPage, setCurrentPage] = useState(0);
  const [users, setUsers] = useState([]);
  
  // ─── Chat State ──────────────────────────────────────────────
  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);

  // ─── UI State ────────────────────────────────────────────────
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#1a1a2e");
  const [size, setSize] = useState(5);
  const [showUsers, setShowUsers] = useState(false);
  const [boardWidth, setBoardWidth] = useState(() => {
    return localStorage.getItem("wb-width") || "100%";
  });
  
  // Undo/Redo Stacks per page
  const undoStack = useRef({}); // { pageIndex: [ [stroke1], [stroke1, stroke2] ] }
  const redoStack = useRef({});

  // ─── Setup & Synchronization ─────────────────────────────────

  useEffect(() => {
    // Attempt join if user object exists (e.g., page refresh)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/");
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    // Always emit join on mount
    socket.emit("userJoined", storedUser);

    // Initial Sync
    const handleSync = (data) => {
      if (!data) return;
      setRoomTitle(data.title);
      setPages(data.pages);
      setCurrentPage(data.currentPage);
      setChatEnabled(data.chatEnabled);
      setChatMessages(data.chatMessages);
    };

    const handleRoomUsers = (data) => {
      setUsers(data.users);
    };

    const handleSessionEnded = () => {
      alert("The presenter has ended the session.");
      navigate("/");
    };

    socket.on("sync-initial-state", handleSync);
    socket.on("roomUsers", handleRoomUsers);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("sync-initial-state", handleSync);
      socket.off("roomUsers", handleRoomUsers);
      socket.off("session-ended", handleSessionEnded);
      socket.emit("disconnect");
    };
  }, [socket, navigate, roomId]);

  // ─── Drawing Event Listeners ─────────────────────────────────

  useEffect(() => {
    const handleStrokeStart = (data) => {
      if (data.roomId !== roomId) return;
      setPages((prev) => {
        const newPages = [...prev];
        if (!newPages[data.pageIndex]) newPages[data.pageIndex] = [];
        // Append new stroke
        newPages[data.pageIndex] = [...newPages[data.pageIndex], data.stroke];
        return newPages;
      });
    };

    const handleStrokeMove = (data) => {
      if (data.roomId !== roomId) return;
      setPages((prev) => {
        const newPages = [...prev];
        const pageStrokes = [...(newPages[data.pageIndex] || [])];
        if (pageStrokes && pageStrokes.length > 0) {
          const lastStroke = { ...pageStrokes[pageStrokes.length - 1] };
          if (["rectangle", "circle", "line"].includes(lastStroke.tool)) {
            lastStroke.points = [lastStroke.points[0], data.point];
          } else {
            lastStroke.points = [...lastStroke.points, data.point];
          }
          pageStrokes[pageStrokes.length - 1] = lastStroke;
          newPages[data.pageIndex] = pageStrokes;
        }
        return newPages;
      });
    };

    const handleStrokeEnd = (data) => {
      if (data.roomId !== roomId) return;
      // In a real app we might finalize it here, but stroke-move already updated state
    };

    const handleUndoRedo = (data) => {
      if (data.roomId !== roomId) return;
      setPages((prev) => {
        const newPages = [...prev];
        newPages[data.pageIndex] = data.strokes;
        return newPages;
      });
    };

    const handleClearPage = (data) => {
      if (data.roomId !== roomId) return;
      setPages((prev) => {
        const newPages = [...prev];
        newPages[data.pageIndex] = [...newPages[data.pageIndex], { type: "clear" }];
        return newPages;
      });
    };

    socket.on("stroke-start", handleStrokeStart);
    socket.on("stroke-move", handleStrokeMove);
    socket.on("stroke-end", handleStrokeEnd);
    socket.on("undo-redo", handleUndoRedo);
    socket.on("clear-page", handleClearPage);

    return () => {
      socket.off("stroke-start", handleStrokeStart);
      socket.off("stroke-move", handleStrokeMove);
      socket.off("stroke-end", handleStrokeEnd);
      socket.off("undo-redo", handleUndoRedo);
      socket.off("clear-page", handleClearPage);
    };
  }, [socket, roomId]);

  // ─── Page Event Listeners ────────────────────────────────────

  useEffect(() => {
    const handlePageAdded = (data) => {
      setPages((prev) => {
        if (prev.length <= data.pageIndex) {
          const newPages = [...prev];
          newPages[data.pageIndex] = [];
          return newPages;
        }
        return prev;
      });
      setCurrentPage(data.pageIndex);
      setTimeout(() => scrollToPage(data.pageIndex), 100);
    };

    const handlePageDeleted = (data) => {
      setPages(data.pages);
      const validPage = Math.min(data.currentPage, data.pages.length - 1);
      setCurrentPage(validPage);
      setTimeout(() => scrollToPage(validPage), 100);
    };

    const handleChangePage = (data) => {
      if (!isPresenter) {
        setCurrentPage(data.pageIndex);
        scrollToPage(data.pageIndex);
      }
    };

    socket.on("page-added", handlePageAdded);
    socket.on("page-deleted", handlePageDeleted);
    socket.on("change-page", handleChangePage);

    return () => {
      socket.off("page-added", handlePageAdded);
      socket.off("page-deleted", handlePageDeleted);
      socket.off("change-page", handleChangePage);
    };
  }, [socket, isPresenter]);

  const scrollToPage = (index) => {
    const el = document.getElementById(`wb-page-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleLocalStrokeEnd = useCallback((pageIndex, stroke) => {
    setPages((prev) => {
      const newPages = [...prev];
      if (!newPages[pageIndex]) newPages[pageIndex] = [];
      newPages[pageIndex] = [...newPages[pageIndex], stroke];
      return newPages;
    });
  }, []);

  // ─── Presenter Actions ───────────────────────────────────────

  const saveStateToUndo = useCallback(() => {
    if (!undoStack.current[currentPage]) undoStack.current[currentPage] = [];
    undoStack.current[currentPage].push([...pages[currentPage]]);
    redoStack.current[currentPage] = []; // clear redo on new action
  }, [currentPage, pages]);

  const handleClearPage = () => {
    if (!isPresenter) return;
    socket.emit("clear-page", { roomId, pageIndex: currentPage });
    setPages((prev) => {
      const newPages = [...prev];
      newPages[currentPage] = [...newPages[currentPage], { type: "clear" }];
      return newPages;
    });
  };

  const handleAddPage = () => {
    if (!isPresenter) return;
    socket.emit("add-page", { roomId });
  };

  const handleDeletePage = (index) => {
    if (!isPresenter) return;
    if (pages.length <= 1) {
      handleClearPage();
      return;
    }
    if (window.confirm(`Delete Page ${index + 1}?`)) {
      socket.emit("delete-page", { roomId, pageIndex: index });
    }
  };

  const handleChangePage = (index) => {
    setCurrentPage(index);
    scrollToPage(index);
    if (isPresenter) {
      socket.emit("change-page", { roomId, pageIndex: index });
    }
  };

  const handleEndSession = () => {
    if (!isPresenter) return;
    if (window.confirm("Save session whiteboard as PDF?")) {
      const canvases = Array.from(document.querySelectorAll("canvas"));
      exportToPdf(canvases, roomTitle);
    }
    socket.emit("end-session", { roomId });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied to clipboard!");
  };

  // ─── Resize Handle ───────────────────────────────────────────

  const resizeHandleRef = useRef(null);
  const isResizing = useRef(false);

  const startResize = (e) => {
    isResizing.current = true;
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);
  };

  const doResize = (e) => {
    if (isResizing.current) {
      // Calculate new width relative to window
      // min width 40%, max width 95%
      const newWidth = Math.max(40, Math.min(95, (e.clientX / window.innerWidth) * 100));
      setBoardWidth(`${newWidth}%`);
    }
  };

  const stopResize = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", doResize);
    document.removeEventListener("mouseup", stopResize);
    localStorage.setItem("wb-width", boardWidth);
  };

  // ─── Rendering ───────────────────────────────────────────────

  return (
    <div className="room-layout">
      {/* Top Navbar */}
      <nav className="room-navbar">
        <div className="nav-left">
          <h1 className="room-title">{roomTitle}</h1>
          <div className="room-id-badge" onClick={copyRoomId} title="Copy ID">
            ID: {roomId.slice(0, 4)}...{roomId.slice(-4)} 📋
          </div>
        </div>

        {/* Center Navbar Toolbar (Presenter Only) */}
        {isPresenter && (
          <div className="nav-toolbar">
            <div className="tools-group">
              <button className={`tool-btn ${tool === "pencil" ? "active" : ""}`} onClick={() => setTool("pencil")} title="Pencil">✏️</button>
              <button className={`tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")} title="Pen">🖋️</button>
              <button className={`tool-btn ${tool === "brush" ? "active" : ""}`} onClick={() => setTool("brush")} title="Brush">🖌️</button>
              <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => setTool("eraser")} title="Eraser">🧽</button>
            </div>

            <div className="tools-divider" />

            <div className="tools-group">
              <button className={`tool-btn ${tool === "rectangle" ? "active" : ""}`} onClick={() => setTool("rectangle")} title="Rectangle">🟩</button>
              <button className={`tool-btn ${tool === "circle" ? "active" : ""}`} onClick={() => setTool("circle")} title="Circle">⭕</button>
              <button className={`tool-btn ${tool === "line" ? "active" : ""}`} onClick={() => setTool("line")} title="Line">➖</button>
            </div>

            <div className="tools-divider" />

            <div className="tools-group">
              <input type="color" className="color-picker" value={color} onChange={(e) => setColor(e.target.value)} title="Choose Color" />
              <input type="range" className="size-slider" min="1" max="50" value={size} onChange={(e) => setSize(Number(e.target.value))} title={`Size: ${size}`} />
            </div>

            <div className="tools-divider" />

            <div className="tools-group">
              <button className="tool-btn-clear" onClick={handleClearPage} title="Clear Page">Clear</button>
            </div>
          </div>
        )}

        <div className="nav-right">
          <button className="theme-toggle" onClick={() => setShowChat(!showChat)}>
            {showChat ? "💬 Hide Chat" : "💬 Show Chat"}
          </button>
          
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          
          <div className="users-dropdown-container">
            <button 
              className="users-dropdown-btn"
              onClick={() => setShowUsers(!showUsers)}
            >
              👥 {users.length} Online
            </button>
            
            {showUsers && (
              <div className="users-dropdown-menu">
                {users.map((u, i) => (
                  <div key={i} className="user-dropdown-item">
                    <span className="user-avatar">{u.name.charAt(0).toUpperCase()}</span>
                    <span className="user-name">
                      {u.name} {u.userId === user.userId && "(You)"}
                    </span>
                    {u.presenter && <span className="badge-presenter">Host</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isPresenter && (
            <button className="end-session-btn" onClick={handleEndSession}>
              End Session
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Workspace */}
      <div className="workspace">
        
        {/* Left Side: Whiteboard Pages */}
        <div 
          className="whiteboard-area" 
          style={showChat ? { width: boardWidth } : { width: "100%", flex: 1 }}
        >
          {/* Scrolling Canvas Container */}
          <div className="canvas-scroll-container">
            {pages.map((strokes, index) => (
              <div 
                key={index} 
                id={`wb-page-${index}`}
                className="canvas-page-wrapper"
                onClick={() => handleChangePage(index)}
              >
                <WhiteBoard
                  roomId={roomId}
                  pageIndex={index}
                  strokes={strokes}
                  tool={tool}
                  color={color}
                  size={size}
                  isPresenter={isPresenter}
                  socket={socket}
                  isActive={currentPage === index}
                  onStrokeEnd={handleLocalStrokeEnd}
                />
                {isPresenter && (
                  <div className="page-header-controls">
                    <button 
                      className="delete-page-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(index);
                      }}
                      title={`Delete Page ${index + 1}`}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isPresenter && (
              <div className="add-page-container">
                <button className="add-page-bottom-btn" onClick={handleAddPage}>
                  ➕ Add New Page
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Resize Handle - only visible when chat is open */}
        {showChat && (
          <div 
            className="resize-handle"
            ref={resizeHandleRef}
            onMouseDown={startResize}
            title="Drag to resize whiteboard"
          >
            <div className="handle-line"></div>
          </div>
        )}

        {/* Right Side: Chat System */}
        {showChat && (
          <div className="chat-area">
            <Chat 
              socket={socket}
              roomId={roomId}
              user={user}
              isPresenter={isPresenter}
              initialMessages={chatMessages}
              initialChatEnabled={chatEnabled}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default RoomPage;