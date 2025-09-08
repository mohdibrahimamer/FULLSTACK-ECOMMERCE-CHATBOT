import React, { useState, useEffect, useRef } from "react";
import { FaRobot } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <p>chat widget component</p>
      <div className={`chat-widget-container ${isOpen ? "open" : ""}`}>
        {isOpen ? (
          <>
            <div className="chat-header">
              <div className="chat-title">
                <FaRobot />
                <h3>shop now</h3>
              </div>
              <button className="close-button">
                <FaTimes />
              </button>
            </div>
          </>
        ) : (
          <div className=""></div>
        )}
      </div>
    </>
  );
};

export default ChatWidget;
