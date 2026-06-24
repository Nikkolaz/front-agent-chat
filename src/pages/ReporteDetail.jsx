import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getAuditoriaById, sendChatMessage } from "../services/auditService";
import {
  ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, Cpu,
  Send, Sparkles, Building2, CalendarDays, DollarSign,
  TrendingUp, BarChart3, Loader2, MessageSquare,
} from "lucide-react";

/* ─── Sub-componentes ────────────────────────────────── */
const Chip = ({ ok, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "999px", padding: "5px 14px", fontSize: "12px", fontWeight: 700,
    border: ok ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
    background: ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
    color: ok ? "#34D399" : "#FB7185"
  }}>
    {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
    {children}
  </span>
);

const MetricCard = ({ label, value, sub, icon: Icon, color, ok }) => {
  const c = 2 * Math.PI * 40;
  const limit = label.includes("admin") ? 12 : 100;
  const pct = Math.min((value / limit) * 100, 100);
  const off = c - (pct / 100) * c;
  const donutColor = ok ? "#10b981" : "#f43f5e";

  return (
    <div style={{
      borderRadius: "20px",
      border: ok ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(244,63,94,0.25)",
      background: ok ? "rgba(16,185,129,0.04)" : "rgba(244,63,94,0.04)",
      padding: "24px", display: "flex", alignItems: "center", gap: "20px",
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>{label}</p>
        <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>{sub}</p>
        <div style={{ marginTop: "12px" }}><Chip ok={ok}>{ok ? "Cumple" : "No cumple"}</Chip></div>
      </div>
      <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={donutColor} strokeWidth="10"
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>{value}%</span>
        </div>
      </div>
    </div>
  );
};

const quickQuestions = [
  "¿Por qué los porcentajes salieron en 0%?",
  "¿Qué dice la norma sobre este resultado?",
  "Explica los hallazgos principales",
  "¿Qué recomendaciones le darías a la Caja?",
];

/* ════════════════════════════════════════════════════ */
function ReporteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAuditoriaById(id);
      setReporte(data);
      if (data) {
        setMessages([{
          role: "agent",
          text: `¡Hola! Soy AuditorIA. Estoy analizando el reporte de **${data.nombre_ccf}** del período **${data.ano}-${String(data.mes).padStart(2, "0")}**. Pregúntame lo que quieras sobre este reporte específico — tengo acceso completo a sus datos e indicadores.`,
        }]);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const sendMsg = async (textToSend = message) => {
    if (!textToSend.trim() || isChatLoading) return;
    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setMessage("");
    setIsChatLoading(true);
    const respuesta = await sendChatMessage(textToSend, reporte?.nombre_ccf || "", parseInt(id));
    setMessages((prev) => [...prev, { role: "agent", text: respuesta }]);
    setIsChatLoading(false);
  };

  if (loading) {
    return (
      <section className="fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px", color: "#A78BFA" }}>
        <Loader2 size={28} className="animate-spin" />
        <span style={{ fontSize: "16px", fontWeight: 600 }}>Cargando reporte…</span>
      </section>
    );
  }

  if (!reporte) {
    return (
      <section className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <AlertTriangle size={48} color="#FB7185" style={{ opacity: 0.5 }} />
        <p style={{ color: "#94A3B8", fontSize: "16px" }}>Reporte no encontrado.</p>
        <button onClick={() => navigate("/")} style={{ marginTop: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "10px 20px", color: "#E2E8F0", fontWeight: 600, cursor: "pointer" }}>
          Volver al panel
        </button>
      </section>
    );
  }

  const r = reporte;
  const cumple = r.cumplimiento_general;
  const is016 = r.tipo_reporte !== '015A';
  const fecha = r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <section className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "32px" }}>

      {/* ── Header con botón atrás ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px",
            borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
            color: "#94A3B8", cursor: "pointer", transition: "all 200ms", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; e.currentTarget.style.color = "#C4B5FD"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94A3B8"; }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#A78BFA" }}>Detalle del reporte</p>
          <h2 style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>{r.nombre_ccf}</h2>
        </div>
      </div>

      {/* ── Layout principal: métricas | chat ── */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr", alignItems: "start" }}
        className="lg-grid-detail"
      >

        {/* ═══ COLUMNA IZQUIERDA: Métricas ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Dictamen banner */}
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: "20px", padding: "28px",
            display: "flex", alignItems: "center", gap: "20px",
            border: cumple ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(244,63,94,0.25)",
            background: cumple ? "rgba(16,185,129,0.06)" : "rgba(244,63,94,0.06)",
          }}>
            <div style={{
              display: "flex", height: "56px", width: "56px", alignItems: "center", justifyContent: "center",
              borderRadius: "16px", flexShrink: 0,
              border: cumple ? "2px solid rgba(16,185,129,0.3)" : "2px solid rgba(244,63,94,0.3)",
              background: cumple ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
            }}>
              {cumple ? <ShieldCheck size={28} color="#34D399" /> : <AlertTriangle size={28} color="#FB7185" />}
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: cumple ? "#6EE7B7" : "#FDA4AF" }}>Dictamen</p>
              <h3 style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>
                {cumple ? "Cumplimiento verificado" : "Se detectaron incumplimientos"}
              </h3>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              { label: "Caja", value: r.nombre_ccf, icon: Building2 },
              { label: "Período", value: `${r.ano} - M${String(r.mes).padStart(2, "0")}`, icon: CalendarDays },
              { label: "Fecha de carga", value: fecha, icon: CalendarDays },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-card)", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Icon size={14} color="#64748B" />
                  <p style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Métricas financieras — condicional por tipo de reporte */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {(is016 ? [
              { label: "Aportes recaudados", value: r.total_aportes_recaudados, icon: DollarSign, color: "#06B6D4", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
              { label: "Gastos administración", value: r.gastos_administracion, icon: TrendingUp, color: "#F43F5E", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
              { label: "Cuota monetaria", value: r.pago_cuota_monetaria, icon: BarChart3, color: "#10B981", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
            ] : [
              { label: "Total Activos", value: r.total_activos, icon: DollarSign, color: "#3B82F6", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
              { label: "Total Pasivos", value: r.total_pasivos, icon: TrendingUp, color: "#F59E0B", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
              { label: "Total Patrimonio", value: r.total_patrimonio, icon: BarChart3, color: "#10B981", fmt: v => `$${v ? (v / 1_000_000).toFixed(1) : "0"}M` },
            ]).map(({ label, value, icon: Icon, color, fmt }) => (
              <div key={label} style={{ borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-card)", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Icon size={14} color={color} />
                  <p style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                </div>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>
                  {fmt(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Metric donuts — condicional por tipo de reporte */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {is016 ? (
              <>
                <MetricCard label="Gastos administrativos" value={r.porcentaje_administracion ?? 0} sub="Límite normativo: máx 8%" ok={r.limite_administracion_valido} />
                <MetricCard label="Cuota monetaria" value={r.porcentaje_cuota_monetaria ?? 0} sub="Límite normativo: mín 55%" ok={r.minimo_cuota_monetaria_valido} />
              </>
            ) : (
              <>
                <MetricCard label="Ecuación contable" value={r.ecuacion_contable_valida ? 100 : 0} sub="Activo = Pasivo + Patrimonio" ok={r.ecuacion_contable_valida} />
                <MetricCard label="Nivel de endeudamiento" value={r.nivel_endeudamiento ?? 0} sub="Pasivo / Activo" ok={(r.nivel_endeudamiento ?? 0) <= 60} />
              </>
            )}
          </div>

          {/* Análisis cognitivo guardado */}
          <div style={{
            borderRadius: "20px", padding: "24px",
            border: "1px solid rgba(124,58,237,0.2)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                <Cpu size={18} color="#C4B5FD" />
              </div>
              <div>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Análisis cognitivo IA</h4>
                <p style={{ fontSize: "12px", color: "#A78BFA" }}>Dictamen generado al cargar el reporte</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none" style={{ fontSize: "14px", lineHeight: 1.7, color: "#CBD5E1", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
              <ReactMarkdown>{r.analisis_cognitivo}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* ═══ COLUMNA DERECHA: Chat Copilot ═══ */}
        <div style={{
          display: "flex", flexDirection: "column", borderRadius: "24px",
          border: "1px solid rgba(99,102,241,0.2)", background: "var(--color-card)",
          backdropFilter: "blur(20px)", overflow: "hidden", height: "calc(100vh - 140px)",
          position: "sticky", top: "40px",
        }}>

          {/* Chat header */}
          <div style={{
            padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", height: "40px", width: "40px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
                <MessageSquare size={20} color="#A5B4FC" />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Copilot IA</h3>
                <p style={{ fontSize: "12px", color: "#94A3B8" }}>Anclado a este reporte</p>
              </div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "999px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "4px 12px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34D399" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} /> Activo
            </span>
          </div>

          {/* Quick questions */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {quickQuestions.map((q) => (
              <button
                key={q} onClick={() => sendMsg(q)}
                style={{ borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "6px 14px", fontSize: "11px", color: "#CBD5E1", cursor: "pointer", transition: "all 150ms", whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#C7D2FE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#CBD5E1"; }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((item, index) => {
              const isUser = item.role === "user";
              return (
                <div key={index} className="fade-up" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "85%", borderRadius: "16px", padding: "14px 18px", fontSize: "14px", lineHeight: 1.6,
                    ...(isUser
                      ? { background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(99,102,241,0.3)", borderBottomRightRadius: "4px", color: "#E0E7FF" }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: "4px", color: "#E2E8F0" }
                    )
                  }}>
                    <div className="prose prose-invert max-w-none prose-sm">
                      <ReactMarkdown>{item.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
            {isChatLoading && (
              <div className="fade-up" style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ borderRadius: "16px", borderBottomLeftRadius: "4px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", color: "#94A3B8", fontSize: "13px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out infinite" }} />
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out 0.2s infinite" }} />
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366F1", animation: "fadeUp 1s ease-in-out 0.4s infinite" }} />
                  </div>
                  Analizando…
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)", padding: "6px 6px 6px 18px", transition: "border-color 200ms" }}
              onFocus={e => e.currentTarget.style.borderColor = "#6366F1"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
            >
              <input
                value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMsg(); }}
                disabled={isChatLoading}
                placeholder="Pregunta sobre este reporte…"
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: "14px", outline: "none" }}
              />
              <button
                onClick={() => sendMsg()} disabled={isChatLoading || !message.trim()}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40px", width: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #6366F1, #7C3AED)", color: "#fff", border: "none", cursor: isChatLoading || !message.trim() ? "not-allowed" : "pointer", opacity: isChatLoading || !message.trim() ? 0.5 : 1, transition: "all 200ms", flexShrink: 0 }}
              >
                <Send size={16} style={{ marginLeft: "-1px" }} />
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "10px", color: "#64748B", marginTop: "8px" }}>
              La IA tiene contexto completo de este reporte. Verifica indicadores críticos con la normativa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReporteDetail;
