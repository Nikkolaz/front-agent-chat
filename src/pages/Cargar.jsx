import { useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { auditFile } from "../services/auditService";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download,
  RotateCcw, Loader2, ShieldCheck, Building2, Cpu, FileCheck2,
  ChevronDown, Zap, ClipboardList, TrendingUp,
} from "lucide-react";

/* ─── Constantes ─────────────────────────────────────── */
const CAJAS = ["Colsubsidio", "Cafam", "Comfandi", "Compensar", "Comfenalco"];

const STEPS = [
  { id: 1, label: "Reporte recibido",       icon: Upload },
  { id: 2, label: "Estructura validada",    icon: FileCheck2 },
  { id: 3, label: "Indicadores calculados", icon: Cpu },
  { id: 4, label: "Dictamen generado",      icon: ShieldCheck },
];

const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
};

/* ─── Generador de SVG Donut ─────────────────────────── */
// Crea un SVG donut que se puede inyectar en el HTML del PDF
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

/* ─── Sub-componentes ────────────────────────────────── */
const Chip = ({ ok, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "999px", padding: "4px 12px", fontSize: "12px", fontWeight: 700,
    border: ok ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
    background: ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
    color: ok ? "#34D399" : "#FB7185"
  }}>
    {ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
    {children}
  </span>
);

/* ════════════════════════════════════════════════════ */
function Cargar() {
  const fileInputRef = useRef(null);
  const [dragging, setDragging]         = useState(false);
  const [selectedCaja, setSelectedCaja] = useState("Colsubsidio");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [auditResult, setAuditResult]   = useState(null);
  const [showReport, setShowReport]     = useState(false);
  const [error, setError]               = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const fechaProcesamiento = new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

  const applyFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx"].includes(ext)) {
      setError("Formato no permitido. Solo se aceptan archivos .csv y .xlsx");
      return;
    }
    setSelectedFile(file);
    setAuditResult(null);
    setShowReport(false);
    setError("");
  };

  const handleFileChange = (e) => applyFile(e.target.files[0]);
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragging(false); applyFile(e.dataTransfer.files[0]); }, []);
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsLoading(true); setError(""); setAuditResult(null); setShowReport(false);
    try {
      const result = await auditFile(selectedFile, selectedCaja);
      setAuditResult(result);
    } catch {
      setError("No se pudo conectar con el backend. Verifica que el servicio esté activo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null); setAuditResult(null); setShowReport(false); setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExport = () => {
    if (!auditResult) return;
    const r   = auditResult.resultados_calculados;
    const src = auditResult.source === "backend" ? "Backend real" : "Modo simulación";

    // Generar SVG de los donuts (con datos reales)
    // Para Admin, el límite es 8% (usaremos 12% como máximo del gráfico)
    const donutAdmin = createDonutSvg(r.porcentaje_administracion, 12, "#16a34a", "#dc2626", r.limite_administracion_valido);
    // Para Cuota, el límite es 55% (usaremos 100% como máximo del gráfico)
    const donutCuota = createDonutSvg(r.porcentaje_cuota_monetaria, 100, "#16a34a", "#dc2626", r.minimo_cuota_monetaria_valido);

    const badge = (ok) =>
      ok
        ? `<span style="display:inline-flex;align-items:center;gap:5px;background:#052e16;color:#4ade80;border:1px solid #16a34a44;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">✓ Cumple</span>`
        : `<span style="display:inline-flex;align-items:center;gap:5px;background:#2d0a0a;color:#f87171;border:1px solid #ef444444;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;">✕ No cumple</span>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe de Auditoría — ${selectedCaja}</title>
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
    <div class="cover-sub">${selectedCaja} &nbsp;·&nbsp; ${selectedFile?.name}</div>
    <div class="cover-badges">
      <span class="badge badge-blue">📅 ${fechaProcesamiento}</span>
      <span class="badge ${auditResult.source === "backend" ? "badge-ok" : "badge-warn"}">${src}</span>
      <span class="badge ${auditResult.cumplimiento_general ? "badge-ok" : ""}" style="${!auditResult.cumplimiento_general ? "background:rgba(244,63,94,.15);color:#fca5a5;border-color:rgba(244,63,94,.3);" : ""}">
        ${auditResult.cumplimiento_general ? "✓ Cumple" : "✕ No cumple"}
      </span>
    </div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-num">01</div>
      <div class="section-title">Información general</div>
      <div class="meta-grid">
        <div class="meta-card"><div class="meta-label">Caja evaluada</div><div class="meta-value">${selectedCaja}</div></div>
        <div class="meta-card"><div class="meta-label">Fecha de procesamiento</div><div class="meta-value">${fechaProcesamiento}</div></div>
        <div class="meta-card"><div class="meta-label">Archivo procesado</div><div class="meta-value">${selectedFile?.name}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-num">02</div>
      <div class="section-title">Resultados del análisis (Indicadores reales)</div>

      <div class="verdict ${auditResult.cumplimiento_general ? "ok" : "fail"}">
        <div class="verdict-icon">${auditResult.cumplimiento_general ? "🛡️" : "⚠️"}</div>
        <div>
          <div class="verdict-title ${auditResult.cumplimiento_general ? "ok" : "fail"}">
            ${auditResult.cumplimiento_general ? "Cumplimiento general verificado" : "Se detectaron incumplimientos"}
          </div>
          <div class="verdict-sub">Evaluación basada en los indicadores calculados a partir del reporte cargado.</div>
        </div>
      </div>

      <div class="metric-grid" style="margin-top:20px;">
        <div class="metric-card ${r.limite_administracion_valido ? "ok" : "fail"}">
          <div class="metric-info">
            <div class="metric-label">Gastos administrativos</div>
            <div class="metric-sub">Límite normativo máximo: 8%</div>
            <div>${badge(r.limite_administracion_valido)}</div>
          </div>
          <div>${donutAdmin}</div>
        </div>
        
        <div class="metric-card ${r.minimo_cuota_monetaria_valido ? "ok" : "fail"}">
          <div class="metric-info">
            <div class="metric-label">Cuota monetaria</div>
            <div class="metric-sub">Límite normativo mínimo: 55%</div>
            <div>${badge(r.minimo_cuota_monetaria_valido)}</div>
          </div>
          <div>${donutCuota}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-num">03</div>
      <div class="section-title">Resumen de indicadores</div>
      <table>
        <thead><tr><th>Indicador</th><th>Resultado</th><th>Criterio</th><th>Estado</th></tr></thead>
        <tbody>
          <tr>
            <td>Gastos administrativos</td><td><strong>${r.porcentaje_administracion}%</strong></td>
            <td>Máx. 8%</td><td>${badge(r.limite_administracion_valido)}</td>
          </tr>
          <tr>
            <td>Cuota monetaria</td><td><strong>${r.porcentaje_cuota_monetaria}%</strong></td>
            <td>Mín. 55%</td><td>${badge(r.minimo_cuota_monetaria_valido)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-num">04</div>
      <div class="section-title">Análisis cognitivo del sistema</div>
      <div class="analysis"><p>${auditResult.analisis_cognitivo.replace(/\n/g, "<br/>")}</p></div>
    </div>

    <div class="legal">
      <div class="legal-title">⚠ Nota de uso</div>
      <p>Este informe preliminar contiene gráficas SVG inyectadas con datos reales (donuts) provenientes del análisis automatizado. No reemplaza la revisión formal.</p>
    </div>

    <div class="footer">
      <span>Superintendencia del Subsidio Familiar · Auditoría SSF</span>
      <span>Generado: ${fechaProcesamiento} · ${src}</span>
    </div>
  </div>

  <script>window.onload = () => { setTimeout(window.print, 500); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const cumple = auditResult?.cumplimiento_general;
  const r      = auditResult?.resultados_calculados;

  return (
    <section className="fade-in space-y-8 pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#A78BFA" }}>
          Recepción de reportes
        </p>
        <h2 style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", letterSpacing: "-0.02em" }}>
          Cargar reporte financiero
        </h2>
        <p className="mt-1 max-w-xl text-slate-400">
          Adjunta el reporte de la Caja de Compensación para validar indicadores
          financieros y cumplimiento normativo según la Ley 21.
        </p>
      </div>

      <div className={`grid gap-6 transition-all duration-500 ${selectedFile ? "lg:grid-cols-5" : "lg:grid-cols-1"}`}>
        
        {/* ── Panel Carga ── */}
        <div className={`space-y-5 ${selectedFile ? "lg:col-span-3" : ""}`}>
          <div style={{ position: "relative", zIndex: 50, borderRadius: "20px", border: "1px solid var(--color-border)", background: "var(--color-card)", padding: "24px", backdropFilter: "blur(12px)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A78BFA", marginBottom: "12px" }}>
              <Building2 size={16} /> Caja de Compensación evaluada
            </label>
            <div className="relative" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", borderRadius: "12px", border: isSelectOpen ? "1px solid #7C3AED" : "1px solid rgba(255,255,255,0.15)",
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
                  {CAJAS.map((c) => (
                    <button
                      key={c} type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCaja(c); setIsSelectOpen(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "10px 16px",
                        borderRadius: "8px", background: selectedCaja === c ? "rgba(124,58,237,0.15)" : "transparent",
                        color: selectedCaja === c ? "#C4B5FD" : "#E2E8F0", fontSize: "14px", border: "none", cursor: "pointer",
                        transition: "background 150ms"
                      }}
                      onMouseEnter={e => { if(selectedCaja !== c) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if(selectedCaja !== c) e.currentTarget.style.background = "transparent"; }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".csv,.xlsx" style={{ display: "none" }} onChange={handleFileChange} />

          <div
            onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            style={{
              position: "relative", display: "flex", minHeight: "280px", cursor: "pointer", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", overflow: "hidden",
              borderRadius: "24px", border: "2px dashed", transition: "all 300ms",
              borderColor: dragging ? "#7C3AED" : selectedFile ? "rgba(16,185,129,0.5)" : "rgba(124,58,237,0.3)",
              background: dragging ? "rgba(124,58,237,0.08)" : selectedFile ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
              boxShadow: dragging ? "0 0 40px rgba(124,58,237,0.2)" : selectedFile ? "0 0 30px rgba(16,185,129,0.15)" : "none"
            }}
            onMouseEnter={e => { if(!dragging && !selectedFile) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.6)"; e.currentTarget.style.background = "rgba(124,58,237,0.05)"; } }}
            onMouseLeave={e => { if(!dragging && !selectedFile) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; } }}
          >
            {dragging && <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-80" style={{ animation: "scanline 1.2s linear infinite" }} />}

            {!selectedFile ? (
              <>
                <div style={{ display: "flex", height: "80px", width: "80px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: "2px solid", transition: "all 300ms", borderColor: dragging ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.3)", background: dragging ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)", transform: dragging ? "scale(1.1)" : "scale(1)" }}>
                  <Upload size={36} color={dragging ? "#C4B5FD" : "#A78BFA"} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>{dragging ? "¡Suelta el archivo aquí!" : "Arrastra o haz clic para seleccionar"}</p>
                  <p style={{ marginTop: "8px", fontSize: "14px", color: "#94A3B8" }}>Formatos: <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>.csv</span> y <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>.xlsx</span></p>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", height: "80px", width: "80px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: "2px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.15)", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
                  <FileSpreadsheet size={36} color="#34D399" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#34D399" }}><CheckCircle2 size={16} /> Archivo listo para procesar</p>
                  <p style={{ marginTop: "6px", fontSize: "16px", fontWeight: 600, color: "#fff" }}>{selectedFile.name}</p>
                  <p style={{ marginTop: "4px", fontSize: "13px", color: "#94A3B8" }}>{fmtBytes(selectedFile.size)}</p>
                  <p style={{ marginTop: "12px", fontSize: "12px", color: "#64748B", textDecoration: "underline" }}>Haz clic para reemplazar</p>
                </div>
              </>
            )}
          </div>

          {selectedFile && !isLoading && !auditResult && (
            <div className="flex flex-wrap gap-3 fade-up">
              <button
                onClick={handleUpload}
                style={{ display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px", background: "linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)", padding: "14px 28px", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.3)", transition: "all 200ms", fontFamily: "var(--font-heading)", fontSize: "15px" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.3)"; }}
              >
                <Zap size={18} /> Procesar auditoría
              </button>
              <button
                onClick={handleReset}
                style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "14px 24px", color: "#E2E8F0", fontWeight: 600, cursor: "pointer", transition: "all 200ms", fontSize: "14px" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
              >
                <RotateCcw size={16} /> Nuevo reporte
              </button>
            </div>
          )}

          {isLoading && (
            <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", borderRadius: "20px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)", padding: "28px" }}>
              <div style={{ position: "relative", width: "36px", height: "36px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#A78BFA", animation: "spin-slow 1s linear infinite" }} />
                <Cpu size={18} style={{ position: "absolute", inset: 0, margin: "auto", color: "#C4B5FD" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "#E2D9F3", fontSize: "15px" }}>Procesando auditoría…</p>
                <p style={{ fontSize: "13px", color: "#A78BFA" }}>Analizando indicadores financieros con IA</p>
              </div>
            </div>
          )}

          {error && (
            <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: "12px", borderRadius: "16px", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", padding: "20px" }}>
              <AlertTriangle size={20} color="#FB7185" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#FECDD3" }}>{error}</p>
            </div>
          )}
        </div>

        {/* ── Panel Resumen previo ── */}
        {selectedFile && !auditResult && (
          <div className="fade-up space-y-4 lg:col-span-2">
            <div style={{ borderRadius: "20px", border: "1px solid var(--color-border)", background: "var(--color-card)", padding: "24px", backdropFilter: "blur(12px)" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", marginBottom: "16px" }}>Resumen del envío</p>
              {[["Caja evaluada", selectedCaja, Building2], ["Archivo", selectedFile.name, FileSpreadsheet], ["Tamaño", fmtBytes(selectedFile.size), ClipboardList], ["Fecha", fechaProcesamiento, TrendingUp]].map(([k, v, Icon]) => (
                <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", width: "32px", height: "32px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "rgba(255,255,255,0.05)", color: "#94A3B8" }}><Icon size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "#64748B" }}>{k}</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", wordBreak: "break-all" }}>{v}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: "20px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.05)", padding: "24px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A78BFA", marginBottom: "12px" }}>Criterios de validación</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px", background: "rgba(255,255,255,0.05)", padding: "12px 16px" }}>
                  <p style={{ fontSize: "14px", color: "#E2E8F0" }}>Gastos administrativos</p>
                  <span style={{ borderRadius: "999px", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", padding: "4px 10px", fontSize: "11px", fontWeight: 700, color: "#FB7185" }}>Máx. 8%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px", background: "rgba(255,255,255,0.05)", padding: "12px 16px" }}>
                  <p style={{ fontSize: "14px", color: "#E2E8F0" }}>Cuota monetaria</p>
                  <span style={{ borderRadius: "999px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", padding: "4px 10px", fontSize: "11px", fontWeight: 700, color: "#34D399" }}>Mín. 55%</span>
                </div>
              </div>
            </div>

            {!isLoading && (
              <button
                onClick={handleUpload}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", borderRadius: "14px", background: "linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)", padding: "14px", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.3)", transition: "all 200ms", fontFamily: "var(--font-heading)", fontSize: "15px" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.3)"; }}
              >
                <Zap size={18} /> Procesar auditoría
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Resultado ── */}
      {auditResult && (
        <div className="space-y-6 fade-up">
          
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", borderRadius: "20px", border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)", padding: "20px 24px", overflowX: "auto" }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} style={{ display: "flex", flex: 1, alignItems: "center", minWidth: "120px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                    <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "2px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.2)", boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
                      <Icon size={18} color="#6EE7B7" />
                    </div>
                    <p style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#34D399" }}>{step.label}</p>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, rgba(16,185,129,0.4), transparent)", margin: "0 12px", transform: "translateY(-12px)" }} />}
                </div>
              );
            })}
          </div>

          {/* Dictamen banner */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", border: cumple ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)", background: cumple ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)", padding: "32px", display: "flex", flexDirection: "column", gap: "20px", ...({ "@media (min-width: 768px)": { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } }) }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: cumple ? "radial-gradient(circle at 0% 50%, rgba(16,185,129,0.15), transparent 50%)" : "radial-gradient(circle at 0% 50%, rgba(244,63,94,0.15), transparent 50%)" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ display: "flex", height: "72px", width: "72px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: cumple ? "2px solid rgba(16,185,129,0.4)" : "2px solid rgba(244,63,94,0.4)", background: cumple ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)", boxShadow: cumple ? "0 0 32px rgba(16,185,129,0.3)" : "0 0 32px rgba(244,63,94,0.3)", flexShrink: 0 }}>
                {cumple ? <ShieldCheck size={36} color="#34D399" /> : <AlertTriangle size={36} color="#FB7185" />}
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: cumple ? "#6EE7B7" : "#FDA4AF" }}>Dictamen preliminar</p>
                <h3 style={{ marginTop: "4px", fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>{cumple ? "Cumplimiento verificado" : "Se detectaron incumplimientos"}</h3>
                <p style={{ marginTop: "6px", fontSize: "14px", color: "#94A3B8" }}>{selectedCaja} · {selectedFile?.name}</p>
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <span style={{ borderRadius: "999px", border: auditResult.source === "backend" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)", background: auditResult.source === "backend" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", padding: "6px 16px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: auditResult.source === "backend" ? "#6EE7B7" : "#FCD34D" }}>{auditResult.source === "backend" ? "Backend real" : "Simulación"}</span>
              <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "6px 16px", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", cursor: "pointer", transition: "all 200ms" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
                <RotateCcw size={14} /> Nuevo reporte
              </button>
            </div>
          </div>

          {/* Métricas con gráficas reales de anillos incorporadas en la UI también */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: "Gastos administrativos", sub: "Límite normativo: máx 8%", value: r.porcentaje_administracion, ok: r.limite_administracion_valido, limit: 12, donutColor: r.limite_administracion_valido ? "#10b981" : "#f43f5e" },
              { label: "Cuota monetaria", sub: "Límite normativo: mín 55%", value: r.porcentaje_cuota_monetaria, ok: r.minimo_cuota_monetaria_valido, limit: 100, donutColor: r.minimo_cuota_monetaria_valido ? "#10b981" : "#f43f5e" },
            ].map((m) => {
               // Render simple donut in UI
               const pct = Math.min((m.value / m.limit) * 100, 100);
               const c = 2 * Math.PI * 40; // r=40
               const off = c - (pct/100)*c;
               return (
                <div key={m.label} style={{ borderRadius: "24px", border: m.ok ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)", background: m.ok ? "rgba(16,185,129,0.05)" : "rgba(244,63,94,0.05)", padding: "28px", display: "flex", alignItems: "center", gap: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div>
                        <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>{m.label}</p>
                        <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>{m.sub}</p>
                      </div>
                    </div>
                    <Chip ok={m.ok}>{m.ok ? "Cumple" : "No cumple"}</Chip>
                  </div>
                  {/* Donut visual representation for UI */}
                  <div style={{ position: "relative", width: "100px", height: "100px" }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={m.donutColor} strokeWidth="10" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 1s ease-out" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)", lineHeight: 1 }}>{m.value}%</span>
                    </div>
                  </div>
                </div>
               )
            })}
          </div>

          {/* Análisis cognitivo */}
          <div style={{ borderRadius: "24px", border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)", padding: "32px", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", height: "48px", width: "48px", alignItems: "center", justifyContent: "center", borderRadius: "16px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}>
                <Cpu size={24} color="#C4B5FD" />
              </div>
              <div>
                <h4 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>Análisis cognitivo IA</h4>
                <p style={{ fontSize: "14px", color: "#A78BFA", marginTop: "2px" }}>Evaluación automatizada de indicadores financieros</p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none" style={{ fontSize: "15px", lineHeight: 1.7, color: "#E2E8F0" }}>
              <ReactMarkdown>{auditResult.analisis_cognitivo}</ReactMarkdown>
            </div>
          </div>

          {/* Informe completo (collapsible) */}
          <div style={{ borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
            <button
              onClick={() => setShowReport((v) => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px", background: "transparent", border: "none", cursor: "pointer", transition: "background 200ms" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ display: "flex", height: "40px", width: "40px", alignItems: "center", justifyContent: "center", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}>
                  <ClipboardList size={20} color="#CBD5E1" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Ver informe completo a exportar</p>
                  <p style={{ fontSize: "13px", color: "#94A3B8" }}>Incluye todos los detalles y el dictamen final para archivar</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExport(); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "#C4B5FD", cursor: "pointer", transition: "all 200ms" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.25)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; }}
                >
                  <Download size={16} /> Exportar PDF
                </button>
                <div style={{ display: "flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", transition: "transform 300ms", transform: showReport ? "rotate(180deg)" : "none" }}>
                  <ChevronDown size={18} />
                </div>
              </div>
            </button>

            {showReport && (
              <div className="fade-up" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", padding: "32px" }}>
                <p style={{ fontSize: "14px", color: "#94A3B8", textAlign: "center" }}>Vista previa interactiva oculta por brevedad.<br/><br/><strong style={{color:"#fff"}}>Haz clic en "Exportar PDF" para ver el informe real con las gráficas de anillo incorporadas.</strong></p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Cargar;