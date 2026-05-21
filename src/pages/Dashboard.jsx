const kpis = [
  {
    title: "Aportes totales",
    value: "$12.4B",
    detail: "Recaudo consolidado",
  },
  {
    title: "Cajas auditadas",
    value: "38",
    detail: "De 43 registradas",
  },
  {
    title: "Alertas rojas activas",
    value: "7",
    detail: "Requieren revisión",
  },
];

const cumplimientoLey = [
  {
    name: "Gastos administrativos",
    value: 7.76,
    limit: 8,
    label: "Máximo permitido: 8%",
  },
  {
    name: "Subsidio monetario",
    value: 55.17,
    limit: 55,
    label: "Mínimo requerido: 55%",
  },
];

function Dashboard() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
          Supervisión financiera
        </p>
        <h2 className="mt-2 text-4xl font-bold">Dashboard</h2>
        <p className="mt-2 text-gray-400">
          Vista general de auditorías, cumplimiento normativo y alertas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <article
            key={kpi.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/10"
          >
            <p className="text-sm text-gray-400">{kpi.title}</p>
            <h3 className="mt-3 text-3xl font-bold">{kpi.value}</h3>
            <p className="mt-2 text-sm text-gray-500">{kpi.detail}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <h3 className="text-xl font-semibold">Cumplimiento Ley 21</h3>
        <p className="mt-1 text-sm text-gray-400">
          Comparación de indicadores financieros contra límites normativos.
        </p>

        <div className="mt-6 space-y-6">
          {cumplimientoLey.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                  {item.value}%
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;