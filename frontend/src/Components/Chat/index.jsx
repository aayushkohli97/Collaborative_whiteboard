import { useState, useEffect, useRef } from "react";
import "./index.css";

const Chat = ({ socket, roomId, user, isPresenter, initialMessages = [], initialChatEnabled = true }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [chatEnabled, setChatEnabled] = useState(initialChatEnabled);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleToggle = (data) => {
      setChatEnabled(data.enabled);
    };

    socket.on("chat-message", handleMessage);
    socket.on("chat-toggle", handleToggle);

    return () => {
      socket.off("chat-message", handleMessage);
      socket.off("chat-toggle", handleToggle);
    };
  }, [socket]);

  // Sync state if late joiner props update
  useEffect(() => {
    setMessages(initialMessages);
    setChatEnabled(initialChatEnabled);
  }, [initialMessages, initialChatEnabled]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!chatEnabled && !isPresenter) return;

    socket.emit("chat-message", {
      roomId,
      userId: user.userId,
      name: user.name,
      text: inputText.trim()
    });

    setInputText("");
  };

  const toggleChat = () => {
    if (!isPresenter) return;
    socket.emit("chat-toggle", {
      roomId,
      userId: user.userId,
      enabled: !chatEnabled
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span>💬 Room Chat</span>
          {!chatEnabled && <span className="badge badge-warning">Restricted</span>}
        </div>
        
        {isPresenter && (
          <button 
            className={`toggle-btn ${chatEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleChat}
            title={chatEnabled ? "Disable chat for viewers" : "Enable chat for all"}
          >
            {chatEnabled ? "🔓" : "🔒"}
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <span>No messages yet. Say hi! 👋</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSelf = msg.userId === user.userId;
            const showAvatar = !isSelf && (i === 0 || messages[i-1].userId !== msg.userId);

            return (
              <div key={i} className={`message-row ${isSelf ? "self" : "other"}`}>
                {!isSelf && (
                  <div className="msg-avatar-placeholder">
                    {showAvatar && <div className="msg-avatar">{getInitials(msg.name)}</div>}
                  </div>
                )}
                
                <div className="message-content">
                  {!isSelf && showAvatar && <span className="msg-name">{msg.name}</span>}
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={!chatEnabled && !isPresenter ? "Chat restricted by presenter" : "Type a message..."}
          disabled={!chatEnabled && !isPresenter}
          className="chat-input"
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!inputText.trim() || (!chatEnabled && !isPresenter)}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default Chat;
