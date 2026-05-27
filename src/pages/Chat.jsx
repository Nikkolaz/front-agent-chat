import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { sendChatMessage, getAuditorias } from "../services/auditService";
import { MessageSquare, Sparkles, Send, Box, ChevronDown } from "lucide-react";

const quickQuestions = [
  "Validar cumplimiento Ley 21",
  "Resumir hallazgos principales",
  "Identificar indicador crítico",
];

function Chat() {
  const [selectedCaja, setSelectedCaja] = useState("Colsubsidio");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "¡Hola! Soy AuditorIA. Selecciona una Caja de Compensación y hazme preguntas sobre cumplimiento, hallazgos o indicadores financieros. Estoy aquí para ayudarte a agilizar tu análisis.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [allAuditorias, setAllAuditorias] = useState([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    async function loadLastCaja() {
      const data = await getAuditorias();
      if (data && data.length > 0) {
        setAllAuditorias(data);
        setSelectedCaja(data[0].nombre_ccf);
      }
    }
    loadLastCaja();
  }, []);

  const chartData = allAuditorias
    .filter((a) => a.nombre_ccf === selectedCaja)
    .reverse()
    .map((a) => ({
      name: `M${a.mes}/${a.ano}`,
      Administración: a.porcentaje_administracion,
      Cuota: a.porcentaje_cuota_monetaria,
    }));

  const sendMessage = async (textToSend = message) => {
    if (!textToSend.trim() || isLoading) return;
    const userMessage = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    const respuesta = await sendChatMessage(textToSend, selectedCaja);
    const agentMessage = { role: "agent", text: respuesta };

    setMessages((prev) => [...prev, agentMessage]);
    setIsLoading(false);
  };

  return (
    <section className="fade-in" style={{ display: "grid", gap: "24px", minHeight: "calc(100vh - 80px)", gridTemplateColumns: "1fr", ...({ "@media (min-width: 1280px)": { gridTemplateColumns: "360px 1fr" } }) }}>

      {/* ── Sidebar Consultas ── */}
      <aside style={{ height: "max-content", borderRadius: "24px", border: "1px solid var(--color-border)", background: "var(--color-card)", padding: "32px", backdropFilter: "blur(20px)" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#6366F1", marginBottom: "12px" }}>Asistente IA</p>
        <h2 style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>Consulta<br />asistida</h2>
        <p style={{ marginTop: "12px", fontSize: "14px", color: "#94A3B8" }}>Realice preguntas en lenguaje natural sobre cumplimiento, hallazgos e indicadores financieros.</p>

        <div style={{ marginTop: "32px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A78BFA", marginBottom: "12px" }}>
            <Box size={16} /> Contexto actual (Caja)
          </label>
          <div className="relative" style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", borderRadius: "12px", border: isSelectOpen ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.3)", padding: "14px 16px", color: "#fff", fontSize: "14px", cursor: "pointer", transition: "all 200ms"
              }}
            >
              <span>{selectedCaja}</span>
              <ChevronDown size={18} color="#94A3B8" style={{ transform: isSelectOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }} />
            </button>

            {isSelectOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, width: "100%", zIndex: 50,
                borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(13,17,23,0.95)",
                backdropFilter: "blur(16px)", padding: "8px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                animation: "fadeUp 0.2s ease-out"
              }}>
                {["Colsubsidio", "Cafam", "Comfandi", "Compensar", "Comfenalco"].map((c) => (
                  <button
                    key={c} type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCaja(c); setIsSelectOpen(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "10px 16px",
                      borderRadius: "8px", background: selectedCaja === c ? "rgba(99,102,241,0.15)" : "transparent",
                      color: selectedCaja === c ? "#C7D2FE" : "#E2E8F0", fontSize: "14px", border: "none", cursor: "pointer",
                      transition: "background 150ms"
                    }}
                    onMouseEnter={e => { if (selectedCaja !== c) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (selectedCaja !== c) e.currentTarget.style.background = "transparent"; }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: "12px" }}>Consultas rápidas</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {quickQuestions.map((q) => (
              <button
                key={q} onClick={() => sendMessage(q)}
                style={{ width: "100%", textAlign: "left", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", padding: "14px 16px", fontSize: "13px", color: "#E2E8F0", cursor: "pointer", transition: "all 200ms" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#C7D2FE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#E2E8F0"; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 && (
          <div style={{ marginTop: "40px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)", padding: "20px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Sparkles size={14} color="#6366F1" /> Evolución Financiera</h3>
            <div style={{ height: "180px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tick={{ fill: "#64748B" }} tickMargin={8} />
                  <YAxis stroke="#64748B" fontSize={11} tick={{ fill: "#64748B" }} tickMargin={8} />
                  <Tooltip contentStyle={{ background: "rgba(13,17,23,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(8px)" }} itemStyle={{ fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="Administración" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Cuota" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Chat Window ── */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "650px", borderRadius: "24px", border: "1px solid var(--color-border)", background: "var(--color-card)", backdropFilter: "blur(20px)", overflow: "hidden" }}>

        {/* Chat Header */}
        <div style={{ padding: "24px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", height: "48px", width: "48px", alignItems: "center", justifyContent: "center", borderRadius: "14px", background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(124,58,237,0.2) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <MessageSquare size={24} color="#A5B4FC" />
            </div>
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>Conversación de análisis</h3>
              <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>Analizando reportes de <span style={{ color: "#E2E8F0", fontWeight: 600 }}>{selectedCaja}</span></p>
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "999px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "6px 14px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34D399" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }} /> IA Conectada
          </span>
        </div>

        {/* Messages List */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          {messages.map((item, index) => {
            const isUser = item.role === "user";
            return (
              <div key={index} className="fade-up" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", animationDelay: "100ms" }}>
                <div style={{
                  maxWidth: "80%", borderRadius: "20px", padding: "16px 24px", fontSize: "15px", lineHeight: 1.6,
                  ...(isUser
                    ? { background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(124,58,237,0.15) 100%)", border: "1px solid rgba(99,102,241,0.3)", borderBottomRightRadius: "4px", color: "#E0E7FF", boxShadow: "0 10px 30px rgba(99,102,241,0.1)" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: "4px", color: "#E2E8F0" }
                  )
                }}>
                  <div className={`prose prose-invert max-w-none ${isUser ? "" : "prose-p:leading-relaxed"}`}>
                    <ReactMarkdown>{item.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="fade-up" style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ maxWidth: "80%", borderRadius: "20px", borderBottomLeftRadius: "4px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px", color: "#94A3B8" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out infinite" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out 0.2s infinite" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out 0.4s infinite" }} />
                </div>
                AuditorIA está analizando la solicitud...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)", padding: "8px 8px 8px 24px", transition: "border-color 200ms" }}
            onFocus={e => e.currentTarget.style.borderColor = "#6366F1"} onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
          >
            <input
              value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              disabled={isLoading} placeholder="Pregúntale a AuditorIA sobre los indicadores..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: "15px", outline: "none" }}
            />
            <button
              onClick={() => sendMessage()} disabled={isLoading || !message.trim()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "48px", width: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)", color: "#fff", border: "none", cursor: isLoading || !message.trim() ? "not-allowed" : "pointer", opacity: isLoading || !message.trim() ? 0.5 : 1, transition: "all 200ms" }}
              onMouseEnter={e => { if (!isLoading && message.trim()) { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(99,102,241,0.4)"; } }}
              onMouseLeave={e => { if (!isLoading && message.trim()) { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; } }}
            >
              <Send size={20} style={{ marginLeft: "-2px" }} />
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#64748B", marginTop: "12px" }}>La Inteligencia Artificial puede cometer errores. Verifica siempre los indicadores críticos con la normativa legal.</p>
        </div>

      </div>
    </section>
  );
}

export default Chat;