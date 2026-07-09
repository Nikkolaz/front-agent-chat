import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, X, Send, Sparkles, Loader2, Database } from "lucide-react";
import { sendChatGlobal } from "../services/auditService";

const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "¡Hola! Soy el Asistente de Inteligencia de Datos Global. Puedo cruzar información de toda la base de datos, analizar tendencias y comparar cajas del último trimestre. ¿Qué te gustaría saber?",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await sendChatGlobal(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", text: response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "❌ Ocurrió un error al consultar la base de datos." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "¿Qué cajas han fallado la cuota monetaria?",
    "Compara el porcentaje de gastos de administración",
    "¿Cuáles cajas tienen la ecuación contable inválida?",
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end"
    }}>
      {/* Ventana de Chat */}
      {isOpen && (
        <div style={{
          width: "400px",
          height: "550px",
          backgroundColor: "#1E1E1E",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          marginBottom: "16px",
          animation: "slideUp 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px",
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "white"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Database size={20} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Chatbot Global (BD)</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "#121212"
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                backgroundColor: msg.role === "user" ? "#4F46E5" : "#2A2A2A",
                color: "white",
                padding: "12px 16px",
                borderRadius: "12px",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "12px",
                borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "12px",
                fontSize: "14px",
                lineHeight: "1.5",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
              }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p style={{ margin: "0 0 10px 0" }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ margin: "0 0 10px 0", paddingLeft: "20px" }} {...props} />,
                      li: ({ node, ...props }) => <li style={{ marginBottom: "5px" }} {...props} />,
                      strong: ({ node, ...props }) => <strong style={{ color: "#E0E7FF" }} {...props} />,
                      table: ({ node, ...props }) => <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", margin: "10px 0" }} {...props} /></div>,
                      th: ({ node, ...props }) => <th style={{ border: "1px solid #4B5563", padding: "6px", backgroundColor: "#374151" }} {...props} />,
                      td: ({ node, ...props }) => <td style={{ border: "1px solid #4B5563", padding: "6px" }} {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{
                alignSelf: "flex-start",
                backgroundColor: "#2A2A2A",
                padding: "12px 16px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#A1A1AA"
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Analizando la base de datos...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div style={{ padding: "0 16px 12px", backgroundColor: "#121212", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(q);
                  }}
                  style={{
                    backgroundColor: "rgba(79, 70, 229, 0.1)",
                    border: "1px solid rgba(79, 70, 229, 0.3)",
                    color: "#A5B4FC",
                    padding: "6px 10px",
                    borderRadius: "99px",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: "16px",
            backgroundColor: "#1E1E1E",
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}>
            <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pregunta sobre los reportes..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: "#2A2A2A",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "white",
                  outline: "none",
                  fontSize: "14px"
                }}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                style={{
                  backgroundColor: !message.trim() || isLoading ? "#4B5563" : "#4F46E5",
                  border: "none",
                  borderRadius: "8px",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  cursor: !message.trim() || isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          color: "white",
          border: "none",
          boxShadow: "0 8px 25px rgba(79, 70, 229, 0.5)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "transform 0.2s",
          transform: isOpen ? "scale(0.9)" : "scale(1)"
        }}
        title="Chat Global (BD)"
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} />}
      </button>

      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GlobalChat;
