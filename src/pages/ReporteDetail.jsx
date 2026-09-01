import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { getAuditoriaById, sendChatMessage, updateAnalisis, validateAnalisis } from "../services/auditService";
import { 
  ArrowLeft, AlertTriangle, ShieldCheck, CheckCircle2, Loader2, Download,
  Building2, CalendarDays, DollarSign, TrendingUp, BarChart3, Cpu, MessageSquare, Send,
  Edit, Check, X
} from 'lucide-react';

/* â”€â”€â”€ Generador de SVG Donut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function createDonutSvg(value, max, colorOk, colorFail, isOk) {
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((value / max) * 100, 100);
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const color = isOk ? colorOk : colorFail;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="${strokeWidth}" />
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" 
              stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" 
              stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})" />
      <text x="50%" y="45%" text-anchor="middle" dy=".3em" font-size="24" font-weight="800" fill="#0f172a">${value}%</text>
      <text x="50%" y="65%" text-anchor="middle" dy=".3em" font-size="10" font-weight="600" fill="#64748b" text-transform="uppercase">Actual</text>
    </svg>
  `;
}

/* â”€â”€â”€ Sub-componentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

const MetricCard = ({ label, value, sub, ok }) => {
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

  const [isEditingDictamen, setIsEditingDictamen] = useState(false);
  const [editedAnalisis, setEditedAnalisis] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  useEffect(() => {
    if (validationResult) {
      const timer = setTimeout(() => setValidationResult(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [validationResult]);

  const handleEditClick = () => {
    setEditedAnalisis(reporte.analisis_cognitivo || "");
    setIsEditingDictamen(true);
  };
  
  const handleSaveAnalisis = async () => {
    if (!reporte) return;
    setIsUpdating(true);
    try {
      await updateAnalisis(reporte.id, editedAnalisis);
      setReporte(prev => ({ ...prev, analisis_cognitivo: editedAnalisis }));
      setIsEditingDictamen(false);
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el dictamen");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleValidarDictamen = async () => {
    if (!reporte) return;
    setIsValidating(true);
    
    // Agregamos un mensaje de "cargando" opcional, o solo mostramos el spinner en el botón
    try {
      const res = await validateAnalisis(reporte.id);
      setValidationResult(res.veredicto_validador);
      
      // Añadir la respuesta de SuperAudi directamente al chat
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "agent",
        text: `**Resultado de la Validación Automática:**\n\n${res.veredicto_validador}`
      }]);
      
    } catch(err) {
      console.error(err);
      setValidationResult("Error al contactar al Agente Validador.");
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "agent",
        text: "Hubo un error al ejecutar la validación. Revisa la consola o asegúrate de que el backend esté funcionando."
      }]);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExport = () => {
    if (!reporte) return;
    const r = reporte;
    const src = "Backend real";
    const is016 = r.tipo_reporte !== '015A';
    const fechaProcesamiento = r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—";
    const filename = r.nombre_archivo || "Reporte histórico";

    const badge = (ok) =>
      ok
        ? `<span style="display:inline-flex;align-items:center;gap:5px;background:#052e16;color:#4ade80;border:1px solid #16a34a44;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">✓ Cumple</span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;background:#2d0a0a;color:#f87171;border:1px solid #ef444444;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">✕ No cumple</span>`;

    let metricsHtml;
    let tableHtml;

    if (is016) {
      const donutAdmin = createDonutSvg(r.porcentaje_administracion ?? 0, 12, "#16a34a", "#dc2626", r.limite_administracion_valido);
      const donutCuota = createDonutSvg(r.porcentaje_cuota_monetaria ?? 0, 100, "#16a34a", "#dc2626", r.minimo_cuota_monetaria_valido);
      metricsHtml = `
        <div class="metric-card ${r.limite_administracion_valido ? "ok" : "fail"}">
          <div class="metric-info"><div class="metric-label">Gastos administrativos</div><div class="metric-sub">Límite normativo máximo: 8%</div><div>${badge(r.limite_administracion_valido)}</div></div>
          <div>${donutAdmin}</div>
        </div>
        <div class="metric-card ${r.minimo_cuota_monetaria_valido ? "ok" : "fail"}">
          <div class="metric-info"><div class="metric-label">Cuota monetaria</div><div class="metric-sub">Límite normativo mínimo: 55%</div><div>${badge(r.minimo_cuota_monetaria_valido)}</div></div>
          <div>${donutCuota}</div>
        </div>`;
      tableHtml = `
        <tr><td>Gastos administrativos</td><td><strong>${r.porcentaje_administracion ?? 0}%</strong></td><td>Máx. 8%</td><td>${badge(r.limite_administracion_valido)}</td></tr>
        <tr><td>Cuota monetaria</td><td><strong>${r.porcentaje_cuota_monetaria ?? 0}%</strong></td><td>Mín. 55%</td><td>${badge(r.minimo_cuota_monetaria_valido)}</td></tr>`;
    } else {
      const ecOk = r.ecuacion_contable_valida;
      const endPct = r.nivel_endeudamiento ?? 0;
      const donutEc = createDonutSvg(ecOk ? 100 : 0, 100, "#16a34a", "#dc2626", ecOk);
      const donutEnd = createDonutSvg(endPct, 100, "#3b82f6", "#3b82f6", true);
      const fmtM = (v) => v ? `$${(v / 1_000_000).toFixed(1)}M` : '$0M';
      
      metricsHtml = `
        <div class="metric-card ${ecOk ? "ok" : "fail"}">
          <div class="metric-info"><div class="metric-label">Ecuación contable</div><div class="metric-sub">Activo = Pasivo + Patrimonio</div><div>${badge(ecOk)}</div></div>
          <div>${donutEc}</div>
        </div>
        <div class="metric-card ok">
          <div class="metric-info"><div class="metric-label">Nivel de endeudamiento</div><div class="metric-sub">Pasivo / Activo</div><div><span style="display:inline-flex;align-items:center;gap:5px;background:#eff6ff;color:#3b82f6;border:1px solid #93c5fd44;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">${endPct}%</span></div></div>
          <div>${donutEnd}</div>
        </div>`;
      tableHtml = `
        <tr><td>Total Activos</td><td><strong>${fmtM(r.total_activos)}</strong></td><td>—</td><td>—</td></tr>
        <tr><td>Total Pasivos</td><td><strong>${fmtM(r.total_pasivos)}</strong></td><td>—</td><td>—</td></tr>
        <tr><td>Total Patrimonio</td><td><strong>${fmtM(r.total_patrimonio)}</strong></td><td>—</td><td>—</td></tr>
        <tr><td>Ecuación contable</td><td><strong>${ecOk ? "Válida ✓" : "No cuadra ✕"}</strong></td><td>A = P + Pat</td><td>${badge(ecOk)}</td></tr>
        <tr><td>Nivel de endeudamiento</td><td><strong>${endPct}%</strong></td><td>Referencia</td><td><span style="display:inline-flex;align-items:center;gap:5px;background:#eff6ff;color:#3b82f6;border:1px solid #93c5fd44;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">ℹ Informativo</span></td></tr>`;
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe de Auditoría — ${r.nombre_ccf || 'Detectada'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'DM Sans',sans-serif;color:#1e293b;background:#fff;font-size:13px;line-height:1.6;}
    h1,h2,h3,h4,h5,h6{font-family:'Space Grotesk',sans-serif;}

    .cover{background:linear-gradient(135deg,#0f172a 0%,#2e1065 100%);color:#fff;padding:56px 56px 48px;position:relative;}
    .cover-label{font-size:10px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#c4b5fd;margin-bottom:10px;}
    .cover-title{font-size:28px;font-weight:700;line-height:1.2;color:#fff;margin-bottom:6px;}
    .cover-sub{font-size:14px;color:#cbd5e1;}
    .cover-badges{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;}
    .badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 14px;font-size:11px;font-weight:700;border:1px solid;}
    .badge-blue{background:rgba(124,58,237,.15);color:#c4b5fd;border-color:rgba(124,58,237,.3);}
    .badge-ok{background:rgba(16,185,129,.15);color:#6ee7b7;border-color:rgba(16,185,129,.3);}
    .badge-warn{background:rgba(245,158,11,.15);color:#fcd34d;border-color:rgba(245,158,11,.3);}

    .body{padding:40px 56px;}
    .section{margin-bottom:36px;}
    .section-num{font-size:10px;font-weight:700;color:#7c3aed;letter-spacing:.2em;text-transform:uppercase;margin-bottom:4px;}
    .section-title{font-size:16px;font-weight:700;color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:14px;}
    p{color:#475569;margin-bottom:8px;}

    .meta-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:4px;}
    .meta-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;}
    .meta-label{font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.1em;}
    .meta-value{font-size:14px;font-weight:700;color:#0f172a;margin-top:4px;word-break:break-all;}

    .metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
    .metric-card{border-radius:16px;padding:24px;border:1px solid;display:flex;align-items:center;gap:24px;}
    .metric-card.ok{background:#f0fdf4;border-color:#bbf7d0;}
    .metric-card.fail{background:#fff1f2;border-color:#fecdd3;}
    .metric-info{flex:1;}
    .metric-label{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;font-family:'Space Grotesk',sans-serif;}
    .metric-sub{font-size:12px;color:#475569;margin:8px 0 12px;font-weight:500;}

    table{width:100%;border-collapse:collapse;font-size:13px;}
    thead{background:#f1f5f9;}
    th{padding:12px 14px;text-align:left;font-weight:700;color:#475569;text-transform:uppercase;font-size:10px;letter-spacing:.1em;border-bottom:2px solid #e2e8f0;}
    td{padding:12px 14px;border-bottom:1px solid #f1f5f9;color:#334155;font-weight:500;}

    .analysis{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;}
    .verdict{border-radius:12px;padding:20px 24px;display:flex;align-items:center;gap:16px;margin-bottom:4px;}
    .verdict.ok{background:#f0fdf4;border:1px solid #bbf7d0;}
    .verdict.fail{background:#fff1f2;border:1px solid #fecdd3;}
    .verdict-icon{font-size:28px;line-height:1;}
    .verdict-title{font-size:18px;font-weight:700;font-family:'Space Grotesk',sans-serif;}
    .verdict-title.ok{color:#15803d;}
    .verdict-title.fail{color:#be123c;}
    .verdict-sub{font-size:13px;color:#475569;margin-top:2px;font-weight:500;}

    .legal{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:32px;}
    .legal-title{font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;font-weight:600;}
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-label">Superintendencia del Subsidio Familiar</div>
    <div class="cover-title">Informe Preliminar de<br/>Auditoría Financiera</div>
    <div class="cover-sub">${r.nombre_ccf || 'Detectada'} &nbsp;·&nbsp; ${filename}</div>
    <div class="cover-badges">
      <span class="badge badge-blue">📅 ${fechaProcesamiento}</span>
      <span class="badge badge-ok">${src}</span>
      <span class="badge ${r.cumplimiento_general ? "badge-ok" : ""}" style="${!r.cumplimiento_general ? "background:rgba(244,63,94,.15);color:#fca5a5;border-color:rgba(244,63,94,.3);" : ""}">
        ${r.cumplimiento_general ? "✓ Cumple" : "✕ No cumple"}
      </span>
    </div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-num">01</div>
      <div class="section-title">Información general</div>
      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Caja evaluada</div><div class="meta-value">${r.nombre_ccf || 'Detectada'}</div></div>
        <div class="meta-card"><div class="meta-label">Fecha de procesamiento</div><div class="meta-value">${fechaProcesamiento}</div></div>
        <div class="meta-card"><div class="meta-label">Archivo procesado</div><div class="meta-value">${filename}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-num">02</div>
      <div class="section-title">Resultados del análisis (Indicadores reales)</div>

      <div class="verdict ${r.cumplimiento_general ? "ok" : "fail"}">
        <div class="verdict-icon">${r.cumplimiento_general ? "🛡️" : "⚠️"}</div>
        <div>
          <div class="verdict-title ${r.cumplimiento_general ? "ok" : "fail"}">
            ${r.cumplimiento_general ? "Cumplimiento general verificado" : "Se detectaron incumplimientos"}
          </div>
          <div class="verdict-sub">Evaluación basada en los indicadores calculados a partir del reporte cargado.</div>
        </div>
      </div>

      <div class="metric-grid" style="margin-top:20px;">
        ${metricsHtml}
      </div>
    </div>

    <div class="section">
      <div class="section-num">03</div>
      <div class="section-title">Resumen de indicadores</div>
      <table>
        <thead><tr><th>Indicador</th><th>Resultado</th><th>Criterio</th><th>Estado</th></tr></thead>
        <tbody>
          ${tableHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-num">04</div>
      <div class="section-title">Análisis cognitivo del sistema</div>
      <div class="analysis"><p>${(r.analisis_cognitivo || '').replace(/\n/g, "<br/>")}</p></div>
    </div>

    <div class="legal">
      <div class="legal-title">âš  Nota de uso</div>
      <p>Este informe preliminar contiene gráficas SVG inyectadas con datos reales (donuts) provenientes del análisis automatizado. No reemplaza la revisión formal.</p>
    </div>

    <div class="footer">
      <span>Superintendencia del Subsidio Familiar · Auditoría SSF</span>
      <span>Generado: ${fechaProcesamiento} · ${src}</span>
    </div>
  </div>

  <script>window.onload = () => { setTimeout(window.print, 500); }</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (loading) {
    return (
      <section className="fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px", color: "#A78BFA" }}>
        <Loader2 size={28} className="animate-spin" />
        <span style={{ fontSize: "16px", fontWeight: 600 }}>Cargando reporteâ€¦</span>
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

      {/* â”€â”€ Header con botón atrás â”€â”€ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
        
        <button
          onClick={handleExport}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            borderRadius: "12px", border: "1px solid rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.1)", padding: "10px 20px",
            color: "#34D399", fontWeight: 700, cursor: "pointer", transition: "all 200ms",
            fontSize: "14px", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.1)"; }}
        >
          <Download size={16} /> Exportar PDF
        </button>
      </div>

      {/* â”€â”€ Layout principal: métricas | chat â”€â”€ */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr", alignItems: "start" }}
        className="lg-grid-detail"
      >

        {/* â•â•â• COLUMNA IZQUIERDA: Métricas â•â•â• */}
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
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Análisis cognitivo IA</h4>
                <p style={{ fontSize: "12px", color: "#A78BFA" }}>Dictamen generado al cargar el reporte</p>
              </div>
              
              {!isEditingDictamen ? (
                <>
                  <button 
                    onClick={handleValidarDictamen} disabled={isValidating}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)",
                      color: "#10b981", padding: "6px 12px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600, cursor: isValidating ? "not-allowed" : "pointer"
                    }}
                  >
                    {isValidating ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {isValidating ? "Validando..." : "Validar con SuperAudi"}
                  </button>
                  <button 
                    onClick={handleEditClick}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.4)",
                      color: "#c4b5fd", padding: "6px 12px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    <Edit size={14} /> Editar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleSaveAnalisis} disabled={isUpdating}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.5)",
                      color: "#34d399", padding: "6px 12px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer"
                    }}
                  >
                    {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Guardar
                  </button>
                  <button 
                    onClick={() => setIsEditingDictamen(false)} disabled={isUpdating}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)",
                      color: "#fb7185", padding: "6px 12px", borderRadius: "8px",
                      fontSize: "13px", fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer"
                    }}
                  >
                    <X size={14} /> Cancelar
                  </button>
                </>
              )}
            </div>
            
            {isEditingDictamen ? (
              <textarea
                value={editedAnalisis}
                onChange={(e) => setEditedAnalisis(e.target.value)}
                style={{
                  width: "100%", minHeight: "300px",
                  background: "rgba(0,0,0,0.2)", border: "1px solid rgba(124,58,237,0.4)",
                  borderRadius: "12px", padding: "16px", color: "#e2e8f0",
                  fontSize: "14px", lineHeight: 1.7, outline: "none", resize: "vertical"
                }}
              />
            ) : (
              <div className="prose prose-invert max-w-none" style={{ fontSize: "14px", lineHeight: 1.7, color: "#CBD5E1", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                <ReactMarkdown>{r.analisis_cognitivo}</ReactMarkdown>
              </div>
            )}

            {/* Veredicto del Validador */}
            {validationResult && (
              <div style={{ 
                marginTop: "16px", padding: "16px", borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.3)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} color="#10b981" />
                    <h5 style={{ fontSize: "14px", fontWeight: 700, color: "#34d399", margin: 0 }}>Veredicto del Agente Validador</h5>
                  </div>
                  <button onClick={() => setValidationResult(null)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: 0 }}>
                    <X size={14} />
                  </button>
                </div>
                <div className="prose prose-invert max-w-none" style={{ fontSize: "13px", lineHeight: 1.6, color: "#cbd5e1" }}>
                  <ReactMarkdown>{validationResult}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* â•â•â• COLUMNA DERECHA: Chat Copilot â•â•â• */}
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
                  Analizandoâ€¦
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
                onClick={handleValidarDictamen} disabled={isValidating}
                title="Validar dictamen con SuperAudi"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40px", width: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: isValidating ? "not-allowed" : "pointer", transition: "all 200ms", flexShrink: 0 }}
              >
                {isValidating ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              </button>
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
