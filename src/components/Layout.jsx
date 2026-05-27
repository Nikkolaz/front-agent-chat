import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Upload, MessageSquare, LogOut, ChevronRight } from "lucide-react";
import logoSSF from "../assets/logo-ssf.png";

const navItems = [
  { name: "Panel de control",       icon: Home,          path: "/",       color: "text-cyan-400",   glow: "rgba(6,182,212,0.25)" },
  { name: "Cargar reportes",         icon: Upload,        path: "/cargar", color: "text-violet-400", glow: "rgba(124,58,237,0.25)" },
  { name: "Asistente de auditoría",  icon: MessageSquare, path: "/chat",   color: "text-indigo-400", glow: "rgba(99,102,241,0.25)" },
];

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          width: isSidebarOpen ? "272px" : "76px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, rgba(12,9,25,0.98) 0%, rgba(9,12,20,0.98) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          padding: isSidebarOpen ? "28px 20px" : "28px 12px",
          transition: "width 300ms cubic-bezier(0.4,0,0.2,1), padding 300ms cubic-bezier(0.4,0,0.2,1)",
          zIndex: 40,
          overflow: "hidden",
        }}
      >
        {/* ── Logo area ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isSidebarOpen ? "space-between" : "center",
          marginBottom: "32px",
          minHeight: "52px",
        }}>
          {isSidebarOpen && (
            <img
              src={logoSSF}
              alt="SuperSubsidio"
              style={{ height: "64px", maxWidth: "160px", objectFit: "contain", opacity: 0.95, marginLeft: "12px" }}
            />
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Abrir o cerrar menú lateral"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px",
              width: "36px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#94A3B8",
              cursor: "pointer",
              transition: "all 200ms",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.color = "#C4B5FD"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94A3B8"; }}
          >
            <ChevronRight size={16} style={{ transform: isSidebarOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 300ms" }} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                title={item.name}
                end={item.path === "/"}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: isSidebarOpen ? "11px 14px" : "11px 0",
                  justifyContent: isSidebarOpen ? "flex-start" : "center",
                  borderRadius: "12px",
                  border: isActive ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(99,102,241,0.1) 100%)"
                    : "transparent",
                  boxShadow: isActive ? "0 0 20px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                  color: isActive ? "#E2D9F3" : "#94A3B8",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "500",
                  textDecoration: "none",
                  transition: "all 200ms",
                  position: "relative",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#E2E8F0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.classList.contains("active")) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94A3B8";
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        height: "60%",
                        width: "3px",
                        background: "linear-gradient(180deg, #7C3AED, #06B6D4)",
                        borderRadius: "0 4px 4px 0",
                      }} />
                    )}
                    <Icon size={18} style={{ color: isActive ? "#A78BFA" : "#64748B", flexShrink: 0 }} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              justifyContent: isSidebarOpen ? "flex-start" : "center",
              width: "100%",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(244,63,94,0.15)",
              background: "rgba(244,63,94,0.05)",
              color: "#F87171",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              fontFamily: "var(--font-body)",
              transition: "all 200ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.12)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,63,94,0.05)"; e.currentTarget.style.borderColor = "rgba(244,63,94,0.15)"; }}
          >
            <LogOut size={17} style={{ flexShrink: 0 }} />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        marginLeft: isSidebarOpen ? "272px" : "76px",
        minHeight: "100vh",
        padding: "40px",
        transition: "margin-left 300ms cubic-bezier(0.4,0,0.2,1)",
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;