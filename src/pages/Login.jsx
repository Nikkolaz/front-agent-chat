import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/auditService";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await loginUser(username, password);
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      }
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-body)",
    }}>

      {/* ── Aurora background ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 80% 90%, rgba(6,182,212,0.1) 0%, transparent 55%)",
      }} />

      {/* ── Card glassmorphism ── */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.09)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(24px)",
        padding: "40px 36px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)",
        animation: "fadeUp 0.5s cubic-bezier(.16,1,.3,1) both",
      }}>

        {/* ── Icon ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "64px",
            width: "64px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            marginBottom: "20px",
          }}>
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "26px",
            fontWeight: "700",
            color: "#F1F5F9",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}>
            AuditorIA SSF
          </h1>
          <p style={{ marginTop: "6px", fontSize: "13px", color: "#64748B", textAlign: "center" }}>
            Acceso restringido al portal de supervisión
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Username */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94A3B8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Usuario
            </label>
            <input
              type="text"
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              required
              style={{
                display: "block",
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
                color: "#F1F5F9",
                fontSize: "14px",
                fontFamily: "var(--font-body)",
                outline: "none",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#94A3B8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 44px 12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#F1F5F9",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  transition: "border-color 200ms, box-shadow 200ms",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#64748B",
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(244,63,94,0.25)",
              background: "rgba(244,63,94,0.08)",
              color: "#FCA5A5",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 24px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "700",
              fontFamily: "var(--font-heading)",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
              transition: "all 200ms",
              marginTop: "4px",
            }}
            onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,58,237,0.5)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(124,58,237,0.4)"; }}
          >
            {isLoading ? <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} /> : null}
            {isLoading ? "Validando..." : "Ingresar al sistema"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "11px", color: "#334155" }}>
          Superintendencia del Subsidio Familiar · Portal interno
        </p>
      </div>
    </div>
  );
}

export default Login;
