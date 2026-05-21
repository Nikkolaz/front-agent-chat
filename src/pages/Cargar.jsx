import { useRef, useState } from "react";
import { auditFile } from "../services/auditService";

function Cargar() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [error, setError] = useState("");

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setAuditResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError("");
    setAuditResult(null);

    try {
      const result = await auditFile(selectedFile);
      setAuditResult(result);
    } catch (err) {
      setError(
        "No se pudo conectar con el backend o procesar el archivo. Verifica que el backend esté encendido."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-purple-400">
          Carga de información
        </p>

        <h2 className="mt-2 text-4xl font-bold">Cargar archivo</h2>

        <p className="mt-2 text-gray-400">
          Sube un archivo CSV o XLSX para enviarlo al backend de auditoría.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onClick={openFilePicker}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center transition duration-300 hover:border-purple-400 hover:bg-purple-500/10"
        >
          {!selectedFile ? (
            <>
              <p className="text-lg font-medium">
                Arrastra o selecciona un archivo
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Formatos permitidos: .csv y .xlsx
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-300">
                Archivo cargado
              </div>

              <p className="text-lg font-medium text-blue-300">
                {selectedFile.name}
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Haz clic aquí para seleccionar otro archivo
              </p>
            </>
          )}
        </div>

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="mt-6 rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.20)] transition duration-300 hover:scale-105 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Procesando auditoría..." : "Enviar a auditoría"}
          </button>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {auditResult && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div>
            <h3 className="text-2xl font-bold">Resultado de auditoría</h3>

            <p className="mt-1 text-sm text-gray-400">
              Respuesta recibida desde el backend.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Cumplimiento general</p>

              <h4
                className={`mt-3 text-2xl font-bold ${auditResult.cumplimiento_general
                    ? "text-green-300"
                    : "text-red-300"
                  }`}
              >
                {auditResult.cumplimiento_general ? "Cumple" : "No cumple"}
              </h4>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Gastos administrativos</p>

              <h4 className="mt-3 text-2xl font-bold text-blue-300">
                {auditResult.resultados_calculados.porcentaje_administracion}%
              </h4>

              <p className="mt-2 text-sm text-gray-500">Límite máximo: 8%</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-gray-400">Cuota monetaria</p>

              <h4 className="mt-3 text-2xl font-bold text-purple-300">
                {auditResult.resultados_calculados.porcentaje_cuota_monetaria}%
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Mínimo requerido: 55%
              </p>
            </article>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0d1117]/70 p-6">
            <h4 className="text-xl font-semibold">Análisis cognitivo</h4>

            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300">
              {auditResult.analisis_cognitivo}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Cargar;