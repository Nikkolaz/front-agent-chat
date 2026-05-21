import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Cargar Archivos", path: "/cargar" },
  { name: "Agente IA", path: "/chat" },
];

function Layout() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <aside className="fixed left-0 top-0 h-full w-72 border-r border-white/10 bg-[#0b1018]/80 p-6 backdrop-blur-md">
        <h1 className="text-2xl font-bold">SuperSalud</h1>

        <nav className="mt-10 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `relative block rounded-xl border px-4 py-3 text-lg font-medium transition-all duration-300 ${isActive
                  ? "border-blue-400/20 bg-white/10 text-white shadow-[0_0_28px_rgba(99,102,241,0.22)]"
                  : "border-transparent text-gray-300 hover:border-white/10 hover:bg-white/5 hover:text-white hover:shadow-[0_0_18px_rgba(99,102,241,0.12)]"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="ml-72 min-h-screen p-10">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;