import { useState, useEffect, useMemo } from "react";
import { getAuditorias, deleteAuditoria } from "../services/auditService";
import {
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Building2,
  BarChart3,
  RefreshCw,
  ShieldAlert,
  CircleCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

/* ─── Paleta de colores (Skill UI/UX Pro Max) ──────── */
const C = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#7C3AED", // Primary AI
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  cyan: "#0891B2",   // Secondary AI
  accent: "#06B6D4",
  slate: "#94a3b8",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
};

/* ─── Tooltip personalizado ─────────────────────────── */
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "%" }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: "rgba(13, 17, 23, 0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: "12px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      backdropFilter: "blur(12px)"
    }}>
      <p style={{ marginBottom: "8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: p.fill || p.stroke || p.color }} />
          <span style={{ color: "#CBD5E1" }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: "#fff" }}>
            {prefix}{typeof p.value === "number" ? p.value.toLocaleString("es-CO") : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Etiqueta central del Donut (CSS overlay) ─────── */
const DonutCenterLabel = ({ pct }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
  }}>
    <span style={{ fontSize: "36px", fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "var(--font-heading)" }}>{pct}%</span>
    <span style={{ marginTop: "4px", fontSize: "12px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>cumplen</span>
  </div>
);

/* ─── Chip de estado ───────────────────────────────── */
const EstadoChip = ({ cumple }) =>
  cumple ? (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      borderRadius: "999px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)",
      padding: "4px 12px", fontSize: "12px", fontWeight: 700, color: "#34D399"
    }}>
      <CheckCircle2 size={13} /> Cumple
    </span>
  ) : (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      borderRadius: "999px", border: "1px solid rgba(244,63,94,0.3)", background: "rgba(244,63,94,0.1)",
      padding: "4px 12px", fontSize: "12px", fontWeight: 700, color: "#FB7185"
    }}>
      <AlertTriangle size={13} /> Alerta crítica
    </span>
  );

/* ─── Modal de confirmación ────────────────────────── */
const ConfirmModal = ({ open, caja, periodo, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)"
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%", maxWidth: "420px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
          background: "#0f1623", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ marginBottom: "16px", display: "flex", height: "56px", width: "56px", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <ShieldAlert size={28} color="#F43F5E" />
        </div>
        <h4 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-heading)" }}>¿Eliminar reporte?</h4>
        <p style={{ marginTop: "10px", fontSize: "14px", color: "#94A3B8", lineHeight: 1.6 }}>
          Estás a punto de eliminar permanentemente el reporte de <span style={{ fontWeight: 600, color: "#fff" }}>{caja}</span> del período <span style={{ fontFamily: "monospace", color: "#93C5FD" }}>{periodo}</span>.
          Esta acción <span style={{ color: "#F43F5E", fontWeight: 500 }}>no se puede deshacer</span>.
        </p>
        <div style={{ marginTop: "28px", display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel} disabled={loading}
            style={{
              flex: 1, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
              padding: "12px", fontSize: "14px", fontWeight: 600, color: "#CBD5E1", cursor: "pointer", transition: "all 200ms"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", border: "none",
              background: "#E11D48", color: "#fff", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, transition: "all 200ms"
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.background = "#BE123C"; }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.background = "#E11D48"; }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Toast de retroalimentación ───────────────────── */
const Toast = ({ show, type, message }) => {
  if (!show) return null;
  const isOk = type === "success";
  return (
    <div
      style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 50, display: "flex", alignItems: "center", gap: "12px",
        borderRadius: "16px", padding: "16px 20px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
        animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        border: isOk ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(244,63,94,0.3)",
        background: isOk ? "rgba(6,30,20,0.95)" : "rgba(30,6,12,0.95)",
      }}
    >
      {isOk ? <CircleCheck size={20} color="#34D399" /> : <AlertTriangle size={20} color="#FB7185" />}
      <span style={{ fontSize: "14px", fontWeight: 600, color: isOk ? "#A7F3D0" : "#FECDD3" }}>{message}</span>
    </div>
  );
};

/* ─── Sección contenedora ──────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    borderRadius: "24px", border: "1px solid var(--color-border)",
    background: "var(--color-card)", padding: "28px", backdropFilter: "blur(20px)", ...style
  }}>
    {children}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: "24px" }}>
    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>{children}</h3>
    {sub && <p style={{ marginTop: "6px", fontSize: "13px", color: "#94A3B8" }}>{sub}</p>}
  </div>
);

/* ─── Skeleton loader ──────────────────────────────── */
const Skeleton = ({ h = "260px" }) => (
  <div style={{ height: h, borderRadius: "16px", background: "rgba(255,255,255,0.05)", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
);

/* ════════════════════════════════════════════════════ */
function Dashboard() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getAuditorias();
    setAuditorias(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ── KPIs ─────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const total = auditorias.length;
    const cumple = auditorias.filter(a => a.cumplimiento_general).length;
    const alertas = total - cumple;
    const cajas = new Set(auditorias.map(a => a.nombre_ccf)).size;
    const totalAportes = auditorias.reduce((s, a) => s + (a.total_aportes_recaudados || 0), 0);
    const avgAdmin = total > 0 ? (auditorias.reduce((s, a) => s + a.porcentaje_administracion, 0) / total) : 0;
    const avgCuota = total > 0 ? (auditorias.reduce((s, a) => s + a.porcentaje_cuota_monetaria, 0) / total) : 0;
    const tasaCumplimiento = total > 0 ? Math.round((cumple / total) * 100) : 0;

    return [
      {
        id: "aportes", label: "Aportes recaudados", value: totalAportes > 0 ? `$${(totalAportes / 1_000_000).toFixed(1)}M` : "$0",
        sub: "Total consolidado", icon: DollarSign, color: C.accent, bg: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, transparent 100%)", border: "rgba(6,182,212,0.2)"
      },
      {
        id: "cajas", label: "Cajas revisadas", value: cajas.toString(),
        sub: "Entidades únicas auditadas", icon: Building2, color: C.violet, bg: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, transparent 100%)", border: "rgba(124,58,237,0.2)"
      },
      {
        id: "cumplimiento", label: "Tasa cumplimiento", value: `${tasaCumplimiento}%`,
        sub: `${cumple} de ${total} reportes`, icon: CheckCircle2,
        color: tasaCumplimiento >= 80 ? C.emerald : C.amber,
        bg: tasaCumplimiento >= 80 ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, transparent 100%)" : "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, transparent 100%)",
        border: tasaCumplimiento >= 80 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"
      },
      {
        id: "alertas", label: "Alertas críticas", value: alertas.toString(),
        sub: "Incumplimientos detectados", icon: AlertTriangle,
        color: alertas > 0 ? C.rose : C.emerald,
        bg: alertas > 0 ? "linear-gradient(135deg, rgba(244,63,94,0.15) 0%, transparent 100%)" : "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, transparent 100%)",
        border: alertas > 0 ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)"
      },
      {
        id: "admin", label: "Promedio gastos admin.", value: `${avgAdmin.toFixed(2)}%`,
        sub: "Límite legal: máx. 8%", icon: TrendingUp,
        color: avgAdmin <= 8 ? C.emerald : C.rose,
        bg: avgAdmin <= 8 ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, transparent 100%)" : "linear-gradient(135deg, rgba(244,63,94,0.15) 0%, transparent 100%)",
        border: avgAdmin <= 8 ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"
      },
      {
        id: "cuota", label: "Promedio cuota monet.", value: `${avgCuota.toFixed(2)}%`,
        sub: "Límite legal: mín. 55%", icon: BarChart3,
        color: avgCuota >= 55 ? C.emerald : C.rose,
        bg: avgCuota >= 55 ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, transparent 100%)" : "linear-gradient(135deg, rgba(244,63,94,0.15) 0%, transparent 100%)",
        border: avgCuota >= 55 ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"
      },
    ];
  }, [auditorias]);

  /* ── Gráfica 1: Aportes por Caja ─── */
  const aportesBarData = useMemo(() => {
    const map = {};
    auditorias.forEach(a => {
      const k = a.nombre_ccf;
      if (!map[k]) map[k] = { name: k, aportes: 0 };
      map[k].aportes += a.total_aportes_recaudados || 0;
    });
    return Object.values(map)
      .map(d => ({ ...d, aportes: Math.round(d.aportes / 1_000_000 * 100) / 100 }))
      .sort((a, b) => b.aportes - a.aportes);
  }, [auditorias]);

  /* ── Gráfica 2: Evolución temporal ───── */
  const lineData = useMemo(() => {
    const map = {};
    auditorias.forEach(a => {
      const key = `${a.ano}-${String(a.mes).padStart(2, "0")}`;
      if (!map[key]) map[key] = { periodo: key, aportes: 0, reportes: 0 };
      map[key].aportes += a.total_aportes_recaudados || 0;
      map[key].reportes += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(d => ({ ...d, aportes: Math.round(d.aportes / 1_000_000 * 100) / 100 }));
  }, [auditorias]);

  /* ── Gráfica 3: Donut cumplimiento ───────────────── */
  const donutData = useMemo(() => {
    const cumple = auditorias.filter(a => a.cumplimiento_general).length;
    const incumple = auditorias.length - cumple;
    return [
      { name: "Cumple", value: cumple },
      { name: "Alerta", value: incumple },
    ];
  }, [auditorias]);
  const donutPct = auditorias.length > 0 ? Math.round((donutData[0].value / auditorias.length) * 100) : 0;

  /* ── Gráfica 4 & 5: % admin y cuota por caja ─────── */
  const normativaData = useMemo(() => {
    const map = {};
    auditorias.forEach(a => {
      const k = a.nombre_ccf;
      if (!map[k]) map[k] = { name: k, adminSum: 0, cuotaSum: 0, count: 0 };
      map[k].adminSum += a.porcentaje_administracion;
      map[k].cuotaSum += a.porcentaje_cuota_monetaria;
      map[k].count += 1;
    });
    return Object.values(map).map(d => ({
      name: d.name,
      admin: Number((d.adminSum / d.count).toFixed(2)),
      cuota: Number((d.cuotaSum / d.count).toFixed(2)),
    }));
  }, [auditorias]);

  /* ── Gráfica 6: Heatmap (caja × período) ─────────── */
  const heatmapData = useMemo(() => {
    const cajas = [...new Set(auditorias.map(a => a.nombre_ccf))].sort();
    const periodos = [...new Set(auditorias.map(a => `${a.ano}-${String(a.mes).padStart(2, "0")}`))].sort();
    const map = {};
    auditorias.forEach(a => {
      const p = `${a.ano}-${String(a.mes).padStart(2, "0")}`;
      const k = `${a.nombre_ccf}__${p}`;
      map[k] = a.cumplimiento_general;
    });
    return { cajas, periodos, map };
  }, [auditorias]);

  /* ── Modal de confirmación state ─────────────────── */
  const [modal, setModal] = useState({ open: false, id: null, caja: "", periodo: "" });
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  const openDeleteModal = (item) => setModal({ open: true, id: item.id, caja: item.caja, periodo: item.periodo });
  const closeModal = () => setModal({ open: false, id: null, caja: "", periodo: "" });

  const handleDelete = async () => {
    setModalLoading(true);
    const ok = await deleteAuditoria(modal.id);
    setModalLoading(false);
    closeModal();
    if (ok) {
      showToast("success", "Reporte eliminado correctamente.");
      fetchData(true);
    } else {
      showToast("error", "No se pudo eliminar el reporte. Intenta de nuevo.");
    }
  };

  const historial = useMemo(() =>
    [...auditorias]
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
      .map(a => ({
        id: a.id,
        caja: a.nombre_ccf,
        periodo: `${a.ano}-${String(a.mes).padStart(2, "0")}`,
        cumple: a.cumplimiento_general,
        admin: a.porcentaje_administracion,
        cuota: a.porcentaje_cuota_monetaria,
        fecha: a.fecha_creacion ? new Date(a.fecha_creacion).toLocaleDateString("es-CO") : "—",
      })),
    [auditorias]);

  const isEmpty = !loading && auditorias.length === 0;

  return (
    <section className="fade-in" style={{ paddingBottom: "64px", display: "flex", flexDirection: "column", gap: "32px" }}>

      <ConfirmModal open={modal.open} caja={modal.caja} periodo={modal.periodo} onConfirm={handleDelete} onCancel={closeModal} loading={modalLoading} />
      <Toast show={toast.show} type={toast.type} message={toast.message} />

      {/* ── Header ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", ...({ "@media (min-width: 768px)": { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" } }) }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: C.accent }}>Supervisión financiera</p>
          <h2 style={{ marginTop: "8px", fontSize: "36px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", letterSpacing: "-0.02em" }}>Panel de control</h2>
          <p style={{ marginTop: "8px", fontSize: "15px", color: "#94A3B8" }}>Resumen ejecutivo de auditorías financieras y alertas de cumplimiento — Ley 21.</p>
        </div>
        <button
          onClick={() => fetchData(true)} disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: "8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)", padding: "10px 16px", fontSize: "14px", fontWeight: 600, color: "#E2E8F0",
            cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1, transition: "all 200ms", width: "fit-content"
          }}
          onMouseEnter={e => { if(!refreshing) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={e => { if(!refreshing) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Actualizando…" : "Actualizar datos"}
        </button>
      </div>

      {/* ── 6 KPI Cards ── */}
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} h="120px" />)
          : kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <article
                key={kpi.id}
                className="fade-up"
                style={{
                  animationDelay: `${i * 50}ms`, position: "relative", overflow: "hidden", borderRadius: "20px", border: `1px solid ${kpi.border}`,
                  background: kpi.bg, padding: "24px", backdropFilter: "blur(12px)", transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)", cursor: "default"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px -10px ${kpi.color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>{kpi.label}</p>
                    <p style={{ marginTop: "12px", fontSize: "32px", fontWeight: 800, fontFamily: "var(--font-heading)", color: "#fff", lineHeight: 1 }}>{kpi.value}</p>
                    <p style={{ marginTop: "6px", fontSize: "13px", color: "#64748B" }}>{kpi.sub}</p>
                  </div>
                  <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", color: kpi.color }}>
                    <Icon size={24} />
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      {/* ── Fila: Donut + Evolución Temporal ── */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr", ...({ "@media (min-width: 1024px)": { gridTemplateColumns: "1fr 2fr" } }) }}>
        {/* Donut */}
        <Card>
          <SectionTitle sub="Proporción de reportes por resultado">Cumplimiento global</SectionTitle>
          {loading ? <Skeleton /> : isEmpty ? <EmptyState /> : (
            <div style={{ position: "relative", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData} cx="50%" cy="50%" innerRadius={76} outerRadius={105}
                    dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0} paddingAngle={donutData[1].value > 0 ? 3 : 0}
                  >
                    <Cell fill={C.emerald} />
                    <Cell fill={C.rose} />
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix=" reportes" />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenterLabel pct={donutPct} />
            </div>
          )}
          {!loading && !isEmpty && (
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "24px", fontSize: "13px", color: "#94A3B8", fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", background: C.emerald }} /> Cumple ({donutData[0].value})</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "10px", height: "10px", borderRadius: "50%", background: C.rose }} /> Alerta ({donutData[1].value})</span>
            </div>
          )}
        </Card>

        {/* Line Chart */}
        <Card>
          <SectionTitle sub="Aportes recaudados totales por período (en millones COP)">Evolución temporal de aportes</SectionTitle>
          {loading ? <Skeleton /> : isEmpty || lineData.length < 2 ? <EmptyState msg="Se necesitan al menos 2 períodos para mostrar la tendencia." /> : (
            <div style={{ height: "240px", marginTop: "16px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="periodo" stroke="#64748b" fontSize={12} tick={{ fill: "#64748b" }} tickMargin={12} />
                  <YAxis stroke="#64748b" fontSize={12} tick={{ fill: "#64748b" }} unit="M" tickMargin={12} />
                  <Tooltip content={<CustomTooltip prefix="$" suffix="M" />} />
                  <Line
                    type="monotone" dataKey="aportes" name="Aportes"
                    stroke={C.accent} strokeWidth={3}
                    dot={{ fill: C.accent, strokeWidth: 0, r: 5 }}
                    activeDot={{ r: 8, fill: C.accent, stroke: "#060912", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Aportes por Caja ── */}
      <Card>
        <SectionTitle sub="Total de aportes recaudados por entidad (en millones COP)">Aportes por Caja de Compensación</SectionTitle>
        {loading ? <Skeleton h="320px" /> : isEmpty ? <EmptyState /> : (
          <div style={{ height: "320px", marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={aportesBarData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tick={{ fill: "#64748b" }} unit="M" />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} tick={{ fill: "#94a3b8" }} width={140} tickMargin={12} />
                <Tooltip content={<CustomTooltip prefix="$" suffix="M" />} />
                <Bar dataKey="aportes" name="Aportes" radius={[0, 6, 6, 0]} barSize={24}>
                  {aportesBarData.map((_, i) => (
                    <Cell key={i} fill={`hsl(260, 70%, ${65 - i * 4}%)`} /> // Violet scale
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Normativa: Admin y Cuota ── */}
      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {/* Admin */}
        <Card>
          <SectionTitle sub="Promedio por caja vs límite legal (máx. 8%)">Gastos administrativos</SectionTitle>
          {loading ? <Skeleton /> : isEmpty ? <EmptyState /> : (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normativaData} margin={{ top: 16, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tick={{ fill: "#94a3b8" }} angle={-30} textAnchor="end" interval={0} tickMargin={8} />
                  <YAxis stroke="#64748b" fontSize={12} tick={{ fill: "#64748b" }} unit="%" domain={[0, 12]} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <ReferenceLine y={8} stroke={C.rose} strokeDasharray="4 4" strokeWidth={2} label={{ value: "Límite 8%", fill: C.rose, fontSize: 12, fontWeight: 700, position: "insideTopRight", dy: -10 }} />
                  <Bar dataKey="admin" name="% Administración" radius={[6, 6, 0, 0]} barSize={32}>
                    {normativaData.map((d, i) => <Cell key={i} fill={d.admin <= 8 ? C.emerald : C.rose} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Cuota */}
        <Card>
          <SectionTitle sub="Promedio por caja vs mínimo legal (mín. 55%)">Cuota monetaria</SectionTitle>
          {loading ? <Skeleton /> : isEmpty ? <EmptyState /> : (
            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normativaData} margin={{ top: 16, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tick={{ fill: "#94a3b8" }} angle={-30} textAnchor="end" interval={0} tickMargin={8} />
                  <YAxis stroke="#64748b" fontSize={12} tick={{ fill: "#64748b" }} unit="%" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <ReferenceLine y={55} stroke={C.emerald} strokeDasharray="4 4" strokeWidth={2} label={{ value: "Mín. 55%", fill: C.emerald, fontSize: 12, fontWeight: 700, position: "insideTopRight", dy: -10 }} />
                  <Bar dataKey="cuota" name="% Cuota monetaria" radius={[6, 6, 0, 0]} barSize={32}>
                    {normativaData.map((d, i) => <Cell key={i} fill={d.cuota >= 55 ? C.violet : C.amber} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ── Heatmap ── */}
      {!loading && heatmapData.cajas.length > 0 && heatmapData.periodos.length > 0 && (
        <Card>
          <SectionTitle sub="Cumplimiento por caja y período — verde: cumple | rojo: alerta">Mapa de calor — Histórico</SectionTitle>
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "0 16px 12px 0", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "#94A3B8", minWidth: "140px" }}>Caja / Período</th>
                  {heatmapData.periodos.map(p => (
                    <th key={p} style={{ padding: "0 4px 12px", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#94A3B8", minWidth: "64px" }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.cajas.map(caja => (
                  <tr key={caja}>
                    <td style={{ padding: "8px 16px 8px 0", fontSize: "14px", fontWeight: 500, color: "#E2E8F0", whiteSpace: "nowrap" }}>{caja}</td>
                    {heatmapData.periodos.map(p => {
                      const k = `${caja}__${p}`;
                      const tiene = k in heatmapData.map;
                      const cumple = heatmapData.map[k];
                      return (
                        <td key={p} style={{ padding: "4px" }}>
                          <div
                            title={tiene ? (cumple ? "Cumple" : "Alerta") : "Sin datos"}
                            style={{
                              height: "28px", width: "100%", borderRadius: "6px", transition: "all 200ms", cursor: "pointer",
                              background: tiene ? (cumple ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.35)") : "rgba(255,255,255,0.03)",
                              border: tiene ? (cumple ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(244,63,94,0.2)") : "1px solid transparent",
                            }}
                            onMouseEnter={e => { if(tiene) e.currentTarget.style.filter = "brightness(1.5)"; }}
                            onMouseLeave={e => { if(tiene) e.currentTarget.style.filter = "brightness(1)"; }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "20px", display: "flex", gap: "24px", fontSize: "12px", fontWeight: 500, color: "#94A3B8" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "24px", height: "12px", borderRadius: "4px", background: "rgba(16,185,129,0.25)", border: "1px solid rgba(16,185,129,0.2)" }} /> Cumple</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "24px", height: "12px", borderRadius: "4px", background: "rgba(244,63,94,0.35)", border: "1px solid rgba(244,63,94,0.2)" }} /> Alerta crítica</span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ width: "24px", height: "12px", borderRadius: "4px", background: "rgba(255,255,255,0.03)" }} /> Sin reporte</span>
          </div>
        </Card>
      )}

      {/* ── Tabla historial ── */}
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", ...({ "@media (min-width: 768px)": { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } }), marginBottom: "24px" }}>
          <SectionTitle sub="Últimos reportes financieros procesados por el sistema.">Historial de reportes</SectionTitle>
          <span style={{
            display: "inline-flex", borderRadius: "999px", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)",
            padding: "6px 16px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34D399", height: "fit-content"
          }}>Vista real</span>
        </div>

        <div style={{ overflow: "hidden", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead style={{ background: "rgba(255,255,255,0.04)" }}>
              <tr>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Caja</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Período</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Estado</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>Admin %</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>Cuota %</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Fecha</th>
                <th style={{ padding: "16px 20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>—</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><RefreshCw size={18} className="animate-spin" /> Cargando datos…</div>
                  </td>
                </tr>
              ) : historial.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Aún no hay reportes en la base de datos.</td></tr>
              ) : (
                historial.map((item, idx) => (
                  <tr key={item.id ?? idx} style={{ transition: "background 200ms", borderBottom: "1px solid rgba(255,255,255,0.03)" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>{item.caja}</td>
                    <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#CBD5E1" }}>{item.periodo}</td>
                    <td style={{ padding: "16px 20px" }}><EstadoChip cumple={item.cumple} /></td>
                    <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: item.admin <= 8 ? C.emerald : C.rose }}>{item.admin.toFixed(2)}%</td>
                    <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 700, color: item.cuota >= 55 ? C.violet : C.amber }}>{item.cuota.toFixed(2)}%</td>
                    <td style={{ padding: "16px 20px", color: "#94A3B8", fontSize: "13px" }}>{item.fecha}</td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <button
                        onClick={() => openDeleteModal(item)} title="Eliminar reporte"
                        style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: "8px", borderRadius: "8px", transition: "all 200ms" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.15)"; e.currentTarget.style.color = "#F43F5E"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function EmptyState({ msg = "Sin datos disponibles. Carga un reporte para ver las gráficas." }) {
  return (
    <div style={{ display: "flex", height: "240px", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "#64748B" }}>
      <BarChart3 size={40} style={{ opacity: 0.3 }} />
      <p style={{ maxWidth: "260px", textAlign: "center", fontSize: "14px" }}>{msg}</p>
    </div>
  );
}

export default Dashboard;