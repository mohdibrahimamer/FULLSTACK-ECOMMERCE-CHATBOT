import React, { useState, useEffect, useRef } from "react";
import { FaRobot } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { FaRocketchat } from "react-icons/fa";
import { MdOutlineSend } from "react-icons/md";
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const messageEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  // yaha per useEffect likhre "chatopen" k liye
  useEffect(() => {
    if (isOpen && messages.length == 0) {
      const intialMessages = [
        {
          text: "hello iam your shopping assisstant, how can i help you today ?",
          isAgent: true,
        },
      ];
      setMessages(intialMessages);
    }
  }, [isOpen, messages.length]);

  // adding useeffect for  smooth scrolling
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // yaha per handleMessage functionality likhre
  const handleMessage = (e) => {
    e.preventDefault();
    console.log("handleMessage");
    alert("handleMessage functionality");
  };

  // yaha per handleInput change ki functionality likhre
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  console.log(messages);
  // yaha per  handle submit ki functionality likhre
  const handleSubmit = (e) => {};

  // yaha per toggle chat ki functionality likhre
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // yaha per handleMessageChange ki functionality likhre
  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log("input value", inputValue);
    const messages = {
      text: inputValue,
      isAgent: false,
    };
    setMessages((prevMessages) => [...prevMessages, messages]);
    setInputValue("");

    // yaha per sending the data from frontend to backend
    const endPoint = threadId
      ? `http://localhost:5000/chat/${threadId}`
      : "http://localhost:5000/chat";

    try {
      // yaha per sending the data to the API
      const response = await fetch(endPoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputValue }),
      });
      if (!response.ok) {
        throw new Error(`http error ! status:${response.status}`);
      }
      const data = await response.json();
      console.log("data", data);

      // yaha per "agentresponse" k naam se variable declare karey
      // so agent ka response store karey
      const agentResponse = {
        text: data.response,
        threadId: data.threadId,
        isAgent: true,
      };
      setMessages((prevMessages) => [...prevMessages, agentResponse]);
      setThreadId(data.threadId);
      console.log("messages", messages);
    } catch (error) {
      console.log("error no endpoint found", error.message);
    }
  };

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
              <button className="close-button" onClick={toggleChat}>
                <FaTimes />
              </button>
              <div className="">
                {messages.map((message, index) => (
                  // Container for each message (key prop required for React lists)
                  <div key={index}>
                    {/* Message bubble with conditional CSS class for styling */}
                    <div
                      className={`message ${
                        message.isAgent ? "message-bot" : "message-user"
                      }`}
                    >
                      {/* Display message text */}
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* creating invisible div for autoscroll reference */}
              <div className="" ref={messageEndRef} />
            </div>

            <form
              action=""
              className="chat-input-container"
              onSubmit={handleSendMessage}
            >
              <input
                type="text"
                value={inputValue}
                className="message-input"
                onChange={handleInputChange}
                placeholder="Type your message"
              />
              <button
                type="submit"
                onClick={handleSubmit}
                className="send-button"
                disabled={inputValue.trim() === ""}
              >
                <MdOutlineSend size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="">
            <button className="chat-button" onClick={toggleChat}>
              start your chat <FaRocketchat />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWidget;
