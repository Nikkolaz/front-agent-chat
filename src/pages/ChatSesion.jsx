import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getSesionById, sendChatMulti } from "../services/auditService";
import {
  ArrowLeft, AlertTriangle, CheckCircle2,
  Send, Sparkles,
  Loader2, MessageSquare, TrendingUp, Scale,
} from "lucide-react";

/* ─── Preguntas rápidas multi-reporte ─────────────── */
const quickQuestions = [
  "¿Cuál caja tiene mayor riesgo de incumplimiento?",
  "Compara los gastos de administración de todas las cajas",
  "Dame un resumen ejecutivo para la Superintendencia",
  "¿Alguna caja viola el Art. 43 de la Ley 21?",
  "Cruza los datos del balance (015) con el estado de resultados (016)",
];

/* ─── Sub-componentes ────────────────────────────────── */
const Chip = ({ ok, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "5px", borderRadius: "999px", padding: "3px 10px", fontSize: "11px", fontWeight: 700,
    border: ok ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
    background: ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
    color: ok ? "#34D399" : "#FB7185"
  }}>
    {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
    {children}
  </span>
);




/* ════════════════════════════════════════════════════ */
function ChatSesion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [sesionData, setSesionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSesionById(id);
      setSesionData(data);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || message;
    if (!msg.trim() || isChatLoading) return;

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsChatLoading(true);

    const respuesta = await sendChatMulti(msg, parseInt(id));
    setMessages((prev) => [...prev, { role: "assistant", content: respuesta }]);
    setIsChatLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 size={28} color="#A78BFA" style={{ animation: "spin-slow 1s linear infinite" }} />
        <p style={{ fontSize: "16px", color: "#94A3B8", fontWeight: 600 }}>Cargando sesión de auditoría…</p>
      </div>
    );
  }

  if (!sesionData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: "18px", color: "#FB7185", fontWeight: 700 }}>Sesión no encontrada</p>
        <button onClick={() => navigate("/")} style={{ marginTop: "16px", color: "#A78BFA", background: "none", border: "none", cursor: "pointer", fontSize: "14px", textDecoration: "underline" }}>
          Volver al dashboard
        </button>
      </div>
    );
  }

  const { sesion, reportes } = sesionData;
  const reportes015 = reportes.filter((r) => r.tipo_reporte === "015A");
  const reportes016 = reportes.filter((r) => r.tipo_reporte !== "015A");

  return (
    <section className="fade-in" style={{ paddingBottom: "32px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#A78BFA", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginBottom: "16px", padding: 0 }}
        >
          <ArrowLeft size={16} /> Volver al dashboard
        </button>
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#A78BFA" }}>
          Sesión de auditoría #{sesion.id}
        </p>
        <h2 style={{ fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", letterSpacing: "-0.02em", marginTop: "4px" }}>
          Chat multi-auditoría
        </h2>
        <p style={{ marginTop: "6px", fontSize: "14px", color: "#94A3B8" }}>
          {sesion.total_archivos} reportes · {sesion.cajas_involucradas} · Tipos: {sesion.tipos_procesados}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "start" }}>
        {/* ── Sidebar: Reportes de la sesión ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Reportes 015A */}
          {reportes015.length > 0 && (
            <div style={{ borderRadius: "16px", border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Scale size={14} color="#60A5FA" />
                <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60A5FA" }}>
                  📊 Balance (015A)
                </p>
              </div>
              <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "10px" }}>
                Auditoría Financiera: Ecuación contable + Endeudamiento
              </p>
              {reportes015.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{r.nombre_ccf}</p>
                    <p style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      Endeudam: {r.nivel_endeudamiento || 0}%
                    </p>
                  </div>
                  <Chip ok={r.cumplimiento_general}>{r.cumplimiento_general ? "OK" : "Alerta"}</Chip>
                </div>
              ))}
            </div>
          )}

          {/* Reportes 016A */}
          {reportes016.length > 0 && (
            <div style={{ borderRadius: "16px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.04)", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <TrendingUp size={14} color="#C4B5FD" />
                <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C4B5FD" }}>
                  📈 Resultados (016A)
                </p>
              </div>
              <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "10px" }}>
                Auditoría Legal: 16 criterios Ley 21/1982
              </p>
              {reportes016.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{r.nombre_ccf}</p>
                    <p style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                      Admin: {r.porcentaje_administracion || 0}% · Cuota: {r.porcentaje_cuota_monetaria || 0}%
                    </p>
                  </div>
                  <Chip ok={r.cumplimiento_general}>{r.cumplimiento_general ? "OK" : "Alerta"}</Chip>
                </div>
              ))}
            </div>
          )}

          {/* Resumen comparativo */}
          {sesion.resumen_combinado && (
            <div style={{ borderRadius: "16px", border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)", padding: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6EE7B7", marginBottom: "8px" }}>
                📋 Resumen comparativo
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8", lineHeight: 1.5 }}>
                {sesion.resumen_combinado.slice(0, 250)}…
              </p>
            </div>
          )}
        </div>

        {/* ── Chat Area ── */}
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", borderRadius: "20px", border: "1px solid var(--color-border)", background: "var(--color-card)", overflow: "hidden" }}>
          {/* Chat header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", height: "40px", width: "40px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <MessageSquare size={20} color="#C4B5FD" />
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                AuditorIA Multi-Contexto
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8" }}>
                Pregunta sobre {sesion.total_archivos} reportes · {sesion.cajas_involucradas}
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                <div style={{ display: "flex", height: "64px", width: "64px", alignItems: "center", justifyContent: "center", borderRadius: "20px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <Sparkles size={28} color="#C4B5FD" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                    Haz preguntas sobre todas las auditorías
                  </p>
                  <p style={{ marginTop: "6px", fontSize: "13px", color: "#94A3B8", maxWidth: "400px" }}>
                    La IA tiene acceso a los {sesion.total_archivos} reportes procesados y diferencia entre auditorías 015A (Balance) y 016A (Cumplimiento Legal).
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "520px" }}>
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      style={{
                        borderRadius: "12px", border: "1px solid rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.08)",
                        padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#C4B5FD", cursor: "pointer",
                        transition: "all 200ms", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.18)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "80%", borderRadius: "16px", padding: "14px 18px",
                  ...(msg.role === "user"
                    ? { background: "linear-gradient(135deg, #7C3AED, #0891B2)", color: "#fff" }
                    : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#E2E8F0" }
                  ),
                }}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert max-w-none" style={{ fontSize: "14px", lineHeight: 1.7 }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ fontSize: "14px", lineHeight: 1.6 }}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Loader2 size={16} color="#A78BFA" style={{ animation: "spin-slow 1s linear infinite" }} />
                  <span style={{ fontSize: "13px", color: "#A78BFA", fontWeight: 600 }}>Analizando reportes…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre las auditorías..."
                disabled={isChatLoading}
                style={{
                  flex: 1, borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", padding: "14px 18px", fontSize: "14px",
                  color: "#fff", outline: "none", fontFamily: "inherit",
                  transition: "border-color 200ms",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || isChatLoading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "48px", height: "48px", borderRadius: "14px", border: "none",
                  background: message.trim() ? "linear-gradient(135deg, #7C3AED, #0891B2)" : "rgba(255,255,255,0.05)",
                  cursor: message.trim() ? "pointer" : "not-allowed",
                  transition: "all 200ms",
                }}
              >
                <Send size={18} color={message.trim() ? "#fff" : "#64748B"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatSesion;
