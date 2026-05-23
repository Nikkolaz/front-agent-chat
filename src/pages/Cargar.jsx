import { useRef, useState } from "react";
import { auditFile } from "../services/auditService";

const cajas = [
  "Colsubsidio",
  "Cafam",
  "Comfandi",
  "Compensar",
  "Comfenalco",
];

const getSourceStyles = (source) => {
  if (source === "backend") {
    return "border-emerald-400/20 bg-emerald-950/40 text-emerald-200 shadow-[inset_0_0_14px_rgba(16,185,129,0.08)]";
  }

  return "border-amber-400/20 bg-amber-950/30 text-amber-200 shadow-[inset_0_0_14px_rgba(245,158,11,0.07)]";
};

const getComplianceStyles = (isCompliant) => {
  if (isCompliant) {
    return "text-emerald-200";
  }

  return "text-rose-200";
};

const getComplianceBadgeStyles = (isCompliant) => {
  if (isCompliant) {
    return "border-emerald-400/20 bg-emerald-950/40 text-emerald-200";
  }

  return "border-rose-400/20 bg-rose-950/40 text-rose-200";
};

function Cargar() {
  const fileInputRef = useRef(null);

  const [selectedCaja, setSelectedCaja] = useState("Colsubsidio");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState("");

  const fechaProcesamiento = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setAuditResult(null);
    setShowReport(false);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError("");
    setAuditResult(null);
    setShowReport(false);

    try {
      const result = await auditFile(selectedFile);
      setAuditResult(result);
    } catch (err) {
      setError(
        "No se pudo conectar con el backend o procesar el reporte. Verifica que el backend esté encendido."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewReport = () => {
    setSelectedFile(null);
    setAuditResult(null);
    setShowReport(false);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const buildReportText = () => {
    if (!auditResult) return "";

    const resultados = auditResult.resultados_calculados;

    return `
SUPERINTENDENCIA DEL SUBSIDIO FAMILIAR
AUDITORÍA SSF - DEMO FRONTEND

INFORME PRELIMINAR DE AUDITORÍA FINANCIERA

1. INFORMACIÓN GENERAL

Caja de Compensación evaluada:
${selectedCaja}

Reporte procesado:
${selectedFile?.name || "No disponible"}

Fecha de procesamiento:
${fechaProcesamiento}

Origen del resultado:
${auditResult.source === "backend" ? "Backend real" : "Modo simulación"}

2. OBJETIVO

Validar de manera preliminar los indicadores financieros reportados por la Caja de Compensación, con énfasis en gastos administrativos y cuota monetaria.

3. ALCANCE

El presente informe corresponde a una revisión preliminar del archivo cargado en el demo. Incluye cálculo de indicadores, validación contra criterios definidos y generación de análisis automatizado.

4. CRITERIOS DE VALIDACIÓN

- Gastos administrativos: máximo permitido 8%.
- Cuota monetaria: mínimo requerido 55%.

5. RESULTADOS DEL ANÁLISIS

Cumplimiento general:
${auditResult.cumplimiento_general ? "Cumple" : "No cumple"}

Gastos administrativos:
${resultados.porcentaje_administracion}%

Estado gastos administrativos:
${resultados.limite_administracion_valido ? "Cumple" : "No cumple"}

Cuota monetaria:
${resultados.porcentaje_cuota_monetaria}%

Estado cuota monetaria:
${resultados.minimo_cuota_monetaria_valido ? "Cumple" : "No cumple"}

6. ANÁLISIS DEL SISTEMA

${auditResult.analisis_cognitivo}

7. CONCLUSIÓN PRELIMINAR

${auditResult.cumplimiento_general
        ? "Con base en los indicadores calculados, el reporte presenta cumplimiento preliminar frente a los criterios evaluados."
        : "Con base en los indicadores calculados, el reporte presenta posibles incumplimientos que requieren revisión por parte del funcionario responsable."
      }

8. NOTA DE USO

Este documento corresponde a un informe preliminar generado por el demo. No constituye documento oficial ni reemplaza la revisión técnica, jurídica o administrativa de la Superintendencia.
    `.trim();
  };

  const handleExportReport = () => {
    const reportText = buildReportText();

    const blob = new Blob([reportText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "informe_preliminar_auditoria.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
          Recepción de reportes
        </p>

        <h2 className="mt-2 text-4xl font-bold">
          Cargar reporte financiero
        </h2>

        <p className="mt-2 max-w-3xl text-gray-400">
          Adjunta el reporte enviado por la Caja de Compensación para validar
          indicadores financieros y cumplimiento normativo.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <div className="mb-6 max-w-md">
          <label className="block text-sm text-gray-300">
            Caja de Compensación evaluada
          </label>

          <select
            value={selectedCaja}
            onChange={(event) => setSelectedCaja(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white outline-none"
          >
            {cajas.map((caja) => (
              <option key={caja}>{caja}</option>
            ))}
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onClick={openFilePicker}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center transition duration-300 hover:border-blue-400/30 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(59,130,246,0.08)]"
        >
          {!selectedFile ? (
            <>
              <p className="text-lg font-medium">
                Arrastra o selecciona el reporte
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Formatos aceptados: .csv y .xlsx
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full border border-emerald-400/20 bg-emerald-950/40 px-5 py-3 text-sm font-semibold text-emerald-200">
                Reporte cargado
              </div>

              <p className="max-w-xl break-words text-lg font-medium text-blue-200">
                {selectedFile.name}
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Haz clic aquí para reemplazar el reporte
              </p>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="rounded-xl border border-blue-400/20 bg-blue-950/40 px-6 py-3 font-semibold text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.10)] transition duration-300 hover:bg-blue-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Procesando auditoría..." : "Procesar auditoría"}
            </button>

            <button
              onClick={handleNewReport}
              disabled={isLoading}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-200 transition duration-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Nuevo reporte
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-950/40 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}
      </div>

      {auditResult && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-2xl font-bold">Dictamen preliminar</h3>

              <p className="mt-1 text-sm text-gray-400">
                Resumen generado a partir del reporte financiero cargado.
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${getSourceStyles(
                auditResult.source
              )}`}
            >
              {auditResult.source === "backend"
                ? "Backend real"
                : "Modo simulación"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Cumplimiento general</p>

              <h4
                className={`mt-3 text-2xl font-bold ${getComplianceStyles(
                  auditResult.cumplimiento_general
                )}`}
              >
                {auditResult.cumplimiento_general ? "Cumple" : "No cumple"}
              </h4>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Gastos administrativos</p>

              <h4 className="mt-3 text-2xl font-bold text-blue-200">
                {
                  auditResult.resultados_calculados
                    .porcentaje_administracion
                }
                %
              </h4>

              <p className="mt-2 text-sm text-gray-500">Límite máximo: 8%</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Cuota monetaria</p>

              <h4 className="mt-3 text-2xl font-bold text-indigo-200">
                {
                  auditResult.resultados_calculados
                    .porcentaje_cuota_monetaria
                }
                %
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Mínimo requerido: 55%
              </p>
            </article>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              "Reporte recibido",
              "Estructura validada",
              "Indicadores calculados",
              "Dictamen generado",
            ].map((step) => (
              <div
                key={step}
                className="rounded-xl border border-blue-400/10 bg-blue-950/20 px-4 py-3 text-sm text-blue-100"
              >
                {step}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1117]/70 p-6">
            <h4 className="text-xl font-semibold">Análisis del sistema</h4>

            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300">
              {auditResult.analisis_cognitivo}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-xl font-semibold">
                  Informe preliminar
                </h4>

                <p className="mt-1 text-sm text-gray-400">
                  Visualiza el informe completo antes de exportarlo.
                </p>
              </div>

              <button
                onClick={() => setShowReport((current) => !current)}
                className="w-fit rounded-xl border border-blue-400/20 bg-blue-950/40 px-6 py-3 font-semibold text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.10)] transition duration-300 hover:bg-blue-900/40"
              >
                {showReport ? "Ocultar informe" : "Ver informe preliminar"}
              </button>
            </div>
          </div>

          {showReport && (
            <div className="rounded-2xl border border-white/10 bg-[#0d1117]/80 p-8">
              <div className="border-b border-white/10 pb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
                  Auditoría SSF
                </p>

                <h4 className="mt-2 text-3xl font-bold">
                  Informe preliminar de auditoría financiera
                </h4>

                <p className="mt-2 text-sm text-gray-400">
                  Documento generado para revisión del funcionario responsable.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-gray-400">Caja evaluada</p>
                  <p className="mt-1 font-semibold">{selectedCaja}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-gray-400">Fecha de procesamiento</p>
                  <p className="mt-1 font-semibold">{fechaProcesamiento}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                  <p className="text-sm text-gray-400">Reporte procesado</p>
                  <p className="mt-1 break-words font-semibold">
                    {selectedFile?.name}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-6 text-sm leading-7 text-gray-300">
                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    1. Información general
                  </h5>
                  <p>
                    El presente informe corresponde a una revisión preliminar
                    del reporte financiero cargado para la Caja de Compensación
                    seleccionada. El resultado fue generado en{" "}
                    {auditResult.source === "backend"
                      ? "modo backend real"
                      : "modo simulación"}
                    .
                  </p>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    2. Objetivo
                  </h5>
                  <p>
                    Validar de manera preliminar los indicadores financieros
                    reportados por la Caja de Compensación, con énfasis en
                    gastos administrativos y cuota monetaria.
                  </p>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    3. Alcance
                  </h5>
                  <p>
                    La revisión comprende la recepción del archivo, la lectura
                    de datos, el cálculo de indicadores financieros y la
                    generación de un análisis preliminar para apoyar la labor
                    del funcionario auditor.
                  </p>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    4. Criterios de validación
                  </h5>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-gray-400">
                        Gastos administrativos
                      </p>
                      <p className="mt-1 text-white">
                        Máximo permitido: 8%
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-gray-400">Cuota monetaria</p>
                      <p className="mt-1 text-white">
                        Mínimo requerido: 55%
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    5. Resultados del análisis
                  </h5>

                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-white/10 text-gray-300">
                        <tr>
                          <th className="p-4">Indicador</th>
                          <th className="p-4">Resultado</th>
                          <th className="p-4">Criterio</th>
                          <th className="p-4">Estado</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-t border-white/10">
                          <td className="p-4">Gastos administrativos</td>
                          <td className="p-4">
                            {
                              auditResult.resultados_calculados
                                .porcentaje_administracion
                            }
                            %
                          </td>
                          <td className="p-4">Máximo 8%</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getComplianceBadgeStyles(
                                auditResult.resultados_calculados
                                  .limite_administracion_valido
                              )}`}
                            >
                              {auditResult.resultados_calculados
                                .limite_administracion_valido
                                ? "Cumple"
                                : "No cumple"}
                            </span>
                          </td>
                        </tr>

                        <tr className="border-t border-white/10">
                          <td className="p-4">Cuota monetaria</td>
                          <td className="p-4">
                            {
                              auditResult.resultados_calculados
                                .porcentaje_cuota_monetaria
                            }
                            %
                          </td>
                          <td className="p-4">Mínimo 55%</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getComplianceBadgeStyles(
                                auditResult.resultados_calculados
                                  .minimo_cuota_monetaria_valido
                              )}`}
                            >
                              {auditResult.resultados_calculados
                                .minimo_cuota_monetaria_valido
                                ? "Cumple"
                                : "No cumple"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    6. Análisis del sistema
                  </h5>
                  <p>{auditResult.analisis_cognitivo}</p>
                </section>

                <section>
                  <h5 className="mb-2 text-lg font-semibold text-white">
                    7. Conclusión preliminar
                  </h5>
                  <p>
                    {auditResult.cumplimiento_general
                      ? "Con base en los indicadores calculados, el reporte presenta cumplimiento preliminar frente a los criterios evaluados."
                      : "Con base en los indicadores calculados, el reporte presenta posibles incumplimientos que requieren revisión por parte del funcionario responsable."}
                  </p>
                </section>

                <section className="rounded-xl border border-amber-400/20 bg-amber-950/20 p-4 text-amber-100">
                  <h5 className="mb-2 font-semibold">
                    8. Nota de uso
                  </h5>
                  <p>
                    Este informe es preliminar y hace parte del demo frontend.
                    No constituye documento oficial ni reemplaza la revisión
                    técnica, jurídica o administrativa de la Superintendencia.
                  </p>
                </section>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleExportReport}
                  className="rounded-xl border border-blue-400/20 bg-blue-950/40 px-6 py-3 font-semibold text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.10)] transition duration-300 hover:bg-blue-900/40"
                >
                  Exportar informe
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Cargar;