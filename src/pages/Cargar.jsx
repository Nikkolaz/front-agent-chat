import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { auditFile } from "../services/auditService";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  RotateCcw, Cpu, FileCheck2, TrendingUp,
  ChevronDown, Zap, X, Plus, Scale,
  MessageSquare, ShieldCheck
} from "lucide-react";

/* ─── Constantes ─────────────────────────────────────── */
const MAX_FILES = 5;

const STEPS = [
  { id: 1, label: "Reportes recibidos",      icon: Upload },
  { id: 2, label: "Estructura validada",     icon: FileCheck2 },
  { id: 3, label: "Indicadores calculados",  icon: Cpu },
  { id: 4, label: "Dictamen generado",       icon: ShieldCheck },
];

const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
};

/* ─── Auto-categorización de archivos por nombre ───── */
function categorizeFile(file) {
  const match = file.name.match(/CCF(\d{4})-(\d{3}A)/i);
  if (match) {
    const caja = match[1];
    const tipo = match[2].toUpperCase();
    return { file, caja: `CCF-${caja}`, tipo, valid: true };
  }
  return { file, caja: "Desconocida", tipo: "???", valid: false };
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

const TypeBadge = ({ tipo }) => {
  const is015 = tipo === "015A";
  const isUnknown = tipo === "???";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px", borderRadius: "6px", padding: "2px 8px",
      fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em",
      background: isUnknown ? "rgba(245,158,11,0.15)" : is015 ? "rgba(59,130,246,0.15)" : "rgba(124,58,237,0.15)",
      color: isUnknown ? "#FCD34D" : is015 ? "#60A5FA" : "#C4B5FD",
      border: isUnknown ? "1px solid rgba(245,158,11,0.3)" : is015 ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(124,58,237,0.3)",
    }}>
      {isUnknown ? "?" : is015 ? <Scale size={10} /> : <TrendingUp size={10} />}
      {isUnknown ? "Sin tipo" : is015 ? "015A" : "016A"}
    </span>
  );
};


/* ═══════════════════════════════════════════════════ */
function Cargar() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragging, setDragging]                 = useState(false);
  const [selectedFiles, setSelectedFiles]       = useState([]);   // Array of categorized files
  const [isLoading, setIsLoading]               = useState(false);
  const [auditResult, setAuditResult]           = useState(null); // Single-file result
  const [batchResult, setBatchResult]           = useState(null); // Multi-file result
  const [activeResultTab, setActiveResultTab]   = useState(0);
  const [error, setError]                       = useState("");

  const isBatch = selectedFiles.length > 1;

  // Derived categories
  const files015 = selectedFiles.filter((f) => f.tipo === "015A");
  const files016 = selectedFiles.filter((f) => f.tipo === "016A");
  const filesUnknown = selectedFiles.filter((f) => !f.valid);

  const addFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const currentCount = selectedFiles.length;
    const available = MAX_FILES - currentCount;

    if (available <= 0) {
      setError(`Máximo ${MAX_FILES} archivos por sesión.`);
      return;
    }

    const toAdd = fileArray.slice(0, available);
    const invalid = toAdd.filter((f) => {
      const ext = f.name.split(".").pop().toLowerCase();
      return !["csv", "xlsx", "xml"].includes(ext);
    });

    if (invalid.length > 0) {
      setError(`Formato no permitido: ${invalid.map((f) => f.name).join(", ")}. Solo .xml, .csv y .xlsx.`);
      return;
    }

    const categorized = toAdd.map(categorizeFile);
    setSelectedFiles((prev) => [...prev, ...categorized]);
    setAuditResult(null);
    setBatchResult(null);
    setError("");

    if (fileArray.length > available) {
      setError(`Se agregaron ${toAdd.length} de ${fileArray.length} archivos (límite: ${MAX_FILES}).`);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleFileChange = (e) => { addFiles(e.target.files); e.target.value = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [selectedFiles]);
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true); setError(""); setAuditResult(null); setBatchResult(null);
    try {
      const rawFiles = selectedFiles.map((f) => f.file);
      const result = await auditFile(rawFiles, "");

      if (result.sesion_id) {
        // Batch result
        setBatchResult(result);
      } else {
        // Single result
        setAuditResult(result);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo conectar con el backend o hubo un error en la validación.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]); setAuditResult(null); setBatchResult(null); setError(""); setActiveResultTab(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasResult = auditResult || batchResult;

  // For single file backward-compat display
  const cumple = auditResult?.cumplimiento_general;
  const r = auditResult?.resultados_calculados;

  return (
    <section className="fade-in space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#A78BFA" }}>
          Recepción de reportes
        </p>
        <h2 style={{ fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", letterSpacing: "-0.02em" }}>
          Cargar reportes financieros
        </h2>
        <p className="mt-1 max-w-xl text-slate-400">
          Adjunta hasta {MAX_FILES} archivos XML de las Cajas de Compensación.
          El sistema detecta automáticamente si son 015A (Balance) o 016A (Resultados)
          y aplica la lógica de auditoría correspondiente.
        </p>
      </div>

      {!hasResult && (
        <>
          {/* ── Drop zone ── */}
          <input ref={fileInputRef} type="file" accept=".xml,.csv,.xlsx" multiple style={{ display: "none" }} onChange={handleFileChange} />

          <div
            onClick={() => selectedFiles.length < MAX_FILES && fileInputRef.current?.click()}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            style={{
              position: "relative", display: "flex", minHeight: selectedFiles.length > 0 ? "160px" : "240px",
              cursor: selectedFiles.length < MAX_FILES ? "pointer" : "not-allowed",
              flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", overflow: "hidden",
              borderRadius: "24px", border: "2px dashed", transition: "all 300ms",
              borderColor: dragging ? "#7C3AED" : selectedFiles.length > 0 ? "rgba(16,185,129,0.5)" : "rgba(124,58,237,0.3)",
              background: dragging ? "rgba(124,58,237,0.08)" : selectedFiles.length > 0 ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.02)",
            }}
          >
            {selectedFiles.length === 0 ? (
              <>
                <div style={{ display: "flex", height: "72px", width: "72px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: "2px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)" }}>
                  <Upload size={32} color="#A78BFA" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                    {dragging ? "¡Suelta los archivos aquí!" : "Arrastra o haz clic para seleccionar"}
                  </p>
                  <p style={{ marginTop: "8px", fontSize: "14px", color: "#94A3B8" }}>
                    Hasta {MAX_FILES} archivos · Formatos: <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>.xml</span> <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>.csv</span> <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace" }}>.xlsx</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={18} color="#34D399" />
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#34D399" }}>
                    {selectedFiles.length} archivo{selectedFiles.length > 1 ? "s" : ""} listo{selectedFiles.length > 1 ? "s" : ""}
                  </p>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>({selectedFiles.length}/{MAX_FILES})</span>
                </div>
                {selectedFiles.length < MAX_FILES && (
                  <p style={{ fontSize: "12px", color: "#A78BFA", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Plus size={14} /> Haz clic o arrastra para agregar más
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── File list with auto-categorization ── */}
          {selectedFiles.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: files015.length > 0 && files016.length > 0 ? "1fr 1fr" : "1fr", gap: "16px" }}>
              {/* 015A Column */}
              {files015.length > 0 && (
                <div style={{ borderRadius: "16px", border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.04)", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Scale size={16} color="#60A5FA" />
                    <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#60A5FA" }}>
                      📊 Balance General (015A)
                    </p>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "#64748B" }}>{files015.length} archivo{files015.length > 1 ? "s" : ""}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>Auditoría Financiera: Ecuación contable + Endeudamiento</p>
                  {files015.map((cf) => {
                    const idx = selectedFiles.indexOf(cf);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <FileSpreadsheet size={16} color="#60A5FA" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cf.file.name}</p>
                          <p style={{ fontSize: "11px", color: "#64748B" }}>{cf.caja} · {fmtBytes(cf.file.size)}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
                          <X size={14} color="#64748B" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 016A Column */}
              {files016.length > 0 && (
                <div style={{ borderRadius: "16px", border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.04)", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <TrendingUp size={16} color="#C4B5FD" />
                    <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C4B5FD" }}>
                      📈 Estado de Resultados (016A)
                    </p>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "#64748B" }}>{files016.length} archivo{files016.length > 1 ? "s" : ""}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "10px" }}>Auditoría Legal: 16 criterios Ley 21/1982</p>
                  {files016.map((cf) => {
                    const idx = selectedFiles.indexOf(cf);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <FileSpreadsheet size={16} color="#C4B5FD" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cf.file.name}</p>
                          <p style={{ fontSize: "11px", color: "#64748B" }}>{cf.caja} · {fmtBytes(cf.file.size)}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
                          <X size={14} color="#64748B" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Unknown files */}
              {filesUnknown.length > 0 && (
                <div style={{ borderRadius: "16px", border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)", padding: "16px", gridColumn: "1 / -1" }}>
                  <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#FCD34D", marginBottom: "8px" }}>
                    ⚠ Archivos sin tipo detectado
                  </p>
                  {filesUnknown.map((cf) => {
                    const idx = selectedFiles.indexOf(cf);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", marginBottom: "6px" }}>
                        <FileSpreadsheet size={16} color="#FCD34D" />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{cf.file.name}</p>
                          <p style={{ fontSize: "11px", color: "#64748B" }}>{fmtBytes(cf.file.size)} · Se procesará con detección automática</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                          <X size={14} color="#64748B" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Action buttons ── */}
          {selectedFiles.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-3 fade-up">
              <button
                onClick={handleUpload}
                style={{ display: "flex", alignItems: "center", gap: "10px", borderRadius: "14px", background: "linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)", padding: "14px 28px", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.3)", transition: "all 200ms", fontFamily: "var(--font-heading)", fontSize: "15px" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.3)"; }}
              >
                <Zap size={18} /> Procesar {selectedFiles.length} auditoría{selectedFiles.length > 1 ? "s" : ""}
              </button>
              <button
                onClick={handleReset}
                style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "14px 24px", color: "#E2E8F0", fontWeight: 600, cursor: "pointer", transition: "all 200ms", fontSize: "14px" }}
              >
                <RotateCcw size={16} /> Limpiar todo
              </button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", borderRadius: "20px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)", padding: "28px" }}>
              <div style={{ position: "relative", width: "36px", height: "36px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#A78BFA", animation: "spin-slow 1s linear infinite" }} />
                <Cpu size={18} style={{ position: "absolute", inset: 0, margin: "auto", color: "#C4B5FD" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "#E2D9F3", fontSize: "15px" }}>
                  Procesando {selectedFiles.length} auditoría{selectedFiles.length > 1 ? "s" : ""}…
                </p>
                <p style={{ fontSize: "13px", color: "#A78BFA" }}>
                  {isBatch ? "Analizando cada archivo con su lógica (015A/016A) y generando comparativo" : "Analizando indicadores financieros con IA"}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", gap: "12px", borderRadius: "16px", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)", padding: "20px" }}>
          <AlertTriangle size={20} color="#FB7185" style={{ flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#FECDD3" }}>{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── BATCH RESULT (2-5 archivos) ── */}
      {/* ══════════════════════════════════════════════ */}
      {batchResult && (
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

          {/* Session banner */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", padding: "32px" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 0% 50%, rgba(124,58,237,0.15), transparent 50%)" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", height: "72px", width: "72px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: "2px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.15)", boxShadow: "0 0 32px rgba(124,58,237,0.3)", flexShrink: 0 }}>
                <ShieldCheck size={36} color="#C4B5FD" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#C4B5FD" }}>
                  Sesión de auditoría #{batchResult.sesion_id}
                </p>
                <h3 style={{ marginTop: "4px", fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>
                  {batchResult.total_archivos} auditorías procesadas
                </h3>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "8px 16px", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", cursor: "pointer" }}>
                  <RotateCcw size={14} /> Nueva sesión
                </button>
                <button
                  onClick={() => navigate(`/sesion/${batchResult.sesion_id}`)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "999px", border: "1px solid rgba(124,58,237,0.4)", background: "rgba(124,58,237,0.2)", padding: "8px 16px", fontSize: "13px", fontWeight: 700, color: "#C4B5FD", cursor: "pointer" }}
                >
                  <MessageSquare size={14} /> Chat multi-auditoría
                </button>
              </div>
            </div>
          </div>

          {/* Result tabs */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {batchResult.resultados.map((res, i) => {
              const isActive = activeResultTab === i;
              const is015 = res.reporte_origen.tipo_reporte === "015A";
              return (
                <button
                  key={i}
                  onClick={() => setActiveResultTab(i)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", minWidth: "160px",
                    borderRadius: "14px", padding: "14px 16px", border: "1px solid", cursor: "pointer", transition: "all 200ms",
                    borderColor: isActive ? (is015 ? "rgba(59,130,246,0.5)" : "rgba(124,58,237,0.5)") : "rgba(255,255,255,0.08)",
                    background: isActive ? (is015 ? "rgba(59,130,246,0.1)" : "rgba(124,58,237,0.1)") : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                    <TypeBadge tipo={res.reporte_origen.tipo_reporte} />
                    <Chip ok={res.cumplimiento_general}>{res.cumplimiento_general ? "OK" : "Alerta"}</Chip>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                    {res.reporte_origen.nombre_ccf}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active result detail */}
          {batchResult.resultados[activeResultTab] && (() => {
            const res = batchResult.resultados[activeResultTab];
            const rc = res.resultados_calculados;
            const is016 = res.reporte_origen.tipo_reporte !== "015A";

            return (
              <div className="space-y-6">

                {/* Individual analysis */}
                <div style={{ borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <Cpu size={18} color="#C4B5FD" />
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>
                      Análisis individual — {res.reporte_origen.nombre_ccf} ({res.reporte_origen.tipo_reporte})
                    </p>
                    <TypeBadge tipo={res.reporte_origen.tipo_reporte} />
                  </div>
                  <div className="prose prose-invert max-w-none" style={{ fontSize: "14px", lineHeight: 1.7, color: "#E2E8F0" }}>
                    <ReactMarkdown>{res.analisis_cognitivo}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Comparative analysis */}
          <div style={{ borderRadius: "24px", border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)", padding: "32px", backdropFilter: "blur(12px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", height: "48px", width: "48px", alignItems: "center", justifyContent: "center", borderRadius: "16px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}>
                <Cpu size={24} color="#C4B5FD" />
              </div>
              <div>
                <h4 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>Análisis comparativo consolidado</h4>
                <p style={{ fontSize: "14px", color: "#A78BFA", marginTop: "2px" }}>
                  Evaluación cruzada de {batchResult.total_archivos} auditorías · 📊 015A (Balance) vs 📈 016A (Cumplimiento)
                </p>
              </div>
            </div>
            <div className="prose prose-invert max-w-none" style={{ fontSize: "15px", lineHeight: 1.7, color: "#E2E8F0" }}>
              <ReactMarkdown>{batchResult.resumen_combinado}</ReactMarkdown>
            </div>
          </div>

          {/* Chat CTA */}
          <div
            onClick={() => navigate(`/sesion/${batchResult.sesion_id}`)}
            style={{ display: "flex", alignItems: "center", gap: "20px", borderRadius: "20px", border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", padding: "24px", cursor: "pointer", transition: "all 200ms" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", height: "52px", width: "52px", alignItems: "center", justifyContent: "center", borderRadius: "16px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <MessageSquare size={24} color="#C4B5FD" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "16px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>Hacer preguntas sobre las auditorías</p>
              <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>
                La IA puede comparar cajas, cruzar datos 015A con 016A, y responder cualquier pregunta sobre esta sesión
              </p>
            </div>
            <ChevronDown size={20} color="#C4B5FD" style={{ transform: "rotate(-90deg)" }} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── SINGLE RESULT (1 archivo, retrocompat) ── */}
      {/* ══════════════════════════════════════════════ */}
      {auditResult && (
        <div className="space-y-6 fade-up">
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", borderRadius: "20px", border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)", padding: "20px 24px", overflowX: "auto" }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} style={{ display: "flex", flex: 1, alignItems: "center", minWidth: "120px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                    <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "2px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.2)" }}>
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
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "24px", border: cumple ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)", background: cumple ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)", padding: "32px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ display: "flex", height: "72px", width: "72px", alignItems: "center", justifyContent: "center", borderRadius: "20px", border: cumple ? "2px solid rgba(16,185,129,0.4)" : "2px solid rgba(244,63,94,0.4)", background: cumple ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)", flexShrink: 0 }}>
                {cumple ? <ShieldCheck size={36} color="#34D399" /> : <AlertTriangle size={36} color="#FB7185" />}
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: cumple ? "#6EE7B7" : "#FDA4AF" }}>Dictamen preliminar</p>
                <h3 style={{ marginTop: "4px", fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1.1 }}>{cumple ? "Cumplimiento verificado" : "Se detectaron incumplimientos"}</h3>
                <p style={{ marginTop: "6px", fontSize: "14px", color: "#94A3B8" }}>
                  {auditResult.reporte_origen?.nombre_ccf || 'Detectada'} · <TypeBadge tipo={auditResult.reporte_origen?.tipo_reporte || "016A"} />
                </p>
              </div>
            </div>
            <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: "16px" }}>
              <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: "8px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", padding: "6px 16px", fontSize: "13px", fontWeight: 600, color: "#E2E8F0", cursor: "pointer" }}>
                <RotateCcw size={14} /> Nuevo reporte
              </button>
            </div>
          </div>


          {/* Cognitive analysis */}
          <div style={{ borderRadius: "24px", border: "1px solid rgba(124,58,237,0.3)", background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)", padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", height: "48px", width: "48px", alignItems: "center", justifyContent: "center", borderRadius: "16px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
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
        </div>
      )}
    </section>
  );
}

export default Cargar;