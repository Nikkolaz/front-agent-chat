import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import logoSSF from "../assets/logo-ssf.png";

const navItems = [
  { name: "Panel de control", short: "P", path: "/" },
  { name: "Cargar reportes", short: "C", path: "/cargar" },
  { name: "Asistente de auditoría", short: "A", path: "/chat" },
];

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <aside
        className={`fixed left-0 top-0 h-full border-r border-white/10 bg-[#0b1018]/80 p-6 backdrop-blur-md transition-all duration-300 ${isSidebarOpen ? "w-72" : "w-20"
          }`}
      >
        <div className="mb-10 flex h-20 items-start justify-between">
          {isSidebarOpen && (
            <img
              src={logoSSF}
              alt="SuperSubsidio"
              className="ml-5 h-20 w-auto object-contain"
            />
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${isSidebarOpen ? "" : "mx-auto"
              }`}
            aria-label="Abrir o cerrar menú lateral"
          >
            <div className="space-y-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-gray-200"></span>
              <span className="block h-0.5 w-5 rounded-full bg-gray-200"></span>
              <span className="block h-0.5 w-5 rounded-full bg-gray-200"></span>
            </div>
          </button>
        </div>

        <nav className="space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `relative flex items-center rounded-xl border py-3 text-lg font-medium transition-all duration-300 ${isSidebarOpen ? "justify-start px-4" : "justify-center px-0"
                } ${isActive
                  ? "border-blue-400/20 bg-white/10 text-white shadow-[0_0_28px_rgba(99,102,241,0.22)]"
                  : "border-transparent text-gray-300 hover:border-white/10 hover:bg-white/5 hover:text-white hover:shadow-[0_0_18px_rgba(99,102,241,0.12)]"
                }`
              }
            >
              {isSidebarOpen ? (
                <span>{item.name}</span>
              ) : (
                <span className="text-sm font-bold">{item.short}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main
        className={`min-h-screen p-10 transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"
          }`}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;