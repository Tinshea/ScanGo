import React, { useState } from "react";
import axios from "axios";
import env from "../env";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage = { text: inputValue, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");

    try {
      const response = await axios.post(`${env.API_URL}/api/chatbot`, {
        message: inputValue,
      });

      const botMessage = { text: response.data.reply, sender: "bot" };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      const errorMessage = { text: "Erreur de connexion au chatbot.", sender: "bot" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <button
        onClick={toggleChatbot}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          transition: "background-color 0.3s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div
          style={{
            width: "300px",
            height: "400px",
            backgroundColor: "white",
            borderRadius: "15px",
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            marginTop: "10px",
            color: "#333",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "15px",
              overflowY: "auto",
              borderBottom: "1px solid #ddd",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  textAlign: message.sender === "user" ? "right" : "left",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 15px",
                    borderRadius: "10px",
                    backgroundColor: message.sender === "user" ? "black" : "#e0e0e0",
                    color: message.sender === "user" ? "white" : "#333",
                    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
                    fontSize: "13px",
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              padding: "10px",
              borderTop: "1px solid #ddd",
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                marginRight: "10px",
                fontSize: "13px",
              }}
              placeholder="Tapez un message..."
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px",
                backgroundColor: "black",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "background-color 0.3s",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
