const kpis = [
  {
    title: "Aportes reportados",
    value: "$12.4B",
    detail: "Recaudo consolidado",
  },
  {
    title: "Cajas revisadas",
    value: "38",
    detail: "De 43 registradas",
  },
  {
    title: "Alertas críticas",
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

const reportesProcesados = [
  {
    caja: "Colsubsidio",
    reporte: "reporte_financiero_mayo.xlsx",
    estado: "Cumple",
    fecha: "21/05/2026",
  },
  {
    caja: "Cafam",
    reporte: "validacion_ley21_abril.csv",
    estado: "Alerta crítica",
    fecha: "20/05/2026",
  },
  {
    caja: "Comfandi",
    reporte: "indicadores_subsidio.xlsx",
    estado: "En revisión",
    fecha: "19/05/2026",
  },
  {
    caja: "Compensar",
    reporte: "reporte_cuota_monetaria.xlsx",
    estado: "Cumple",
    fecha: "18/05/2026",
  },
];

const getEstadoStyles = (estado) => {
  if (estado === "Cumple") {
    return "border-emerald-400/20 bg-emerald-950/40 text-emerald-200 shadow-[inset_0_0_14px_rgba(16,185,129,0.08)]";
  }

  if (estado === "Alerta crítica") {
    return "border-rose-400/20 bg-rose-950/40 text-rose-200 shadow-[inset_0_0_14px_rgba(244,63,94,0.08)]";
  }

  return "border-amber-400/20 bg-amber-950/30 text-amber-200 shadow-[inset_0_0_14px_rgba(245,158,11,0.07)]";
};

function Dashboard() {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
          Supervisión financiera
        </p>

        <h2 className="mt-2 text-4xl font-bold">Panel de control</h2>

        <p className="mt-2 text-gray-400">
          Resumen ejecutivo del estado de auditorías financieras y alertas de
          cumplimiento.
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
        <h3 className="text-xl font-semibold">Validación normativa Ley 21</h3>

        <p className="mt-1 text-sm text-gray-400">
          Seguimiento de indicadores clave frente a los límites definidos para
          supervisión.
        </p>

        <div className="mt-6 space-y-6">
          {cumplimientoLey.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>

                <span className="rounded-full border border-blue-400/10 bg-blue-950/40 px-3 py-1 text-sm text-blue-200">
                  {item.value}%
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              Historial de reportes procesados
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Últimos reportes financieros revisados por el sistema.
            </p>
          </div>

          <span className="w-fit rounded-full border border-blue-400/20 bg-blue-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
            Vista demo
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="p-4">Caja</th>
                <th className="p-4">Reporte</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha</th>
              </tr>
            </thead>

            <tbody>
              {reportesProcesados.map((item) => (
                <tr
                  key={`${item.caja}-${item.reporte}`}
                  className="border-t border-white/10 transition hover:bg-white/5"
                >
                  <td className="p-4 font-medium text-white">{item.caja}</td>

                  <td className="p-4 text-gray-300">{item.reporte}</td>

                  <td className="p-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${getEstadoStyles(
                        item.estado
                      )}`}
                    >
                      {item.estado}
                    </span>
                  </td>

                  <td className="p-4 text-gray-400">{item.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;