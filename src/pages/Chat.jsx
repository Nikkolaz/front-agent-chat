import { useState } from "react";

const quickQuestions = [
  "Validar cumplimiento Ley 21",
  "Resumir hallazgos principales",
  "Identificar indicador crítico",
];

const getMockResponse = (question, selectedCaja) => {
  const normalizedQuestion = question.toLowerCase();

  if (
    normalizedQuestion.includes("ley 21") ||
    normalizedQuestion.includes("cumple") ||
    normalizedQuestion.includes("cumplimiento")
  ) {
    return `Para ${selectedCaja}, el análisis simulado indica cumplimiento general de la Ley 21. Los gastos administrativos están en 7.76%, por debajo del límite máximo del 8%, y la cuota monetaria está en 55.17%, superando el mínimo requerido del 55%.`;
  }

  if (
    normalizedQuestion.includes("hallazgos") ||
    normalizedQuestion.includes("alertas") ||
    normalizedQuestion.includes("principales")
  ) {
    return `Los hallazgos principales para ${selectedCaja} son de seguimiento preventivo. Aunque los indicadores cumplen, el margen de cuota monetaria frente al mínimo del 55% es estrecho, por lo que se recomienda monitoreo mensual.`;
  }

  if (
    normalizedQuestion.includes("crítico") ||
    normalizedQuestion.includes("critico") ||
    normalizedQuestion.includes("riesgo") ||
    normalizedQuestion.includes("indicador")
  ) {
    return `El indicador crítico para ${selectedCaja} es la cuota monetaria, porque está apenas por encima del mínimo requerido. No representa incumplimiento en este momento, pero sí requiere vigilancia para evitar desviaciones futuras.`;
  }

  return `Análisis simulado para ${selectedCaja}: con la información disponible, la caja presenta cumplimiento general. Se recomienda revisar tendencias mensuales, variaciones atípicas y soportes documentales antes de emitir un concepto definitivo.`;
};

function Chat() {
  const [selectedCaja, setSelectedCaja] = useState("Colsubsidio");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Bienvenido al asistente de auditoría. Seleccione una Caja de Compensación y realice una consulta sobre cumplimiento, hallazgos o indicadores financieros.",
    },
  ]);

  const sendMessage = (textToSend = message) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      role: "user",
      text: textToSend,
    };

    const agentMessage = {
      role: "agent",
      text: getMockResponse(textToSend, selectedCaja),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      agentMessage,
    ]);

    setMessage("");
  };

  return (
    <section className="grid min-h-[calc(100vh-5rem)] gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
          Asistente de auditoría
        </p>

        <h2 className="mt-2 text-4xl font-bold">Consulta asistida</h2>

        <p className="mt-2 text-gray-400">
          Realice preguntas sobre cumplimiento, hallazgos e indicadores
          financieros por caja.
        </p>

        <label className="mt-6 block text-sm text-gray-300">
          Caja de Compensación
        </label>

        <select
          value={selectedCaja}
          onChange={(event) => setSelectedCaja(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white outline-none transition focus:border-blue-400/30"
        >
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfandi</option>
          <option>Compensar</option>
          <option>Comfenalco</option>
        </select>

        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-400">Consultas rápidas</p>

          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition duration-300 hover:border-blue-400/20 hover:bg-blue-950/20 hover:text-white hover:shadow-[0_0_18px_rgba(59,130,246,0.08)]"
            >
              {question}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-h-[650px] flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="border-b border-white/10 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold">
                Conversación de análisis financiero
              </h3>

              <p className="text-sm text-gray-400">
                Contexto actual: {selectedCaja}
              </p>
            </div>

            <span className="w-fit rounded-full border border-amber-400/20 bg-amber-950/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200 shadow-[inset_0_0_14px_rgba(245,158,11,0.07)]">
              Modo simulación
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((item, index) => (
            <div
              key={index}
              className={`flex ${item.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[78%] rounded-2xl border px-5 py-4 text-base leading-7 ${item.role === "user"
                    ? "border-blue-400/20 bg-blue-950/40 text-blue-100 shadow-[0_0_18px_rgba(59,130,246,0.08)]"
                    : "border-white/10 bg-white/10 text-gray-200"
                  }`}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-white/10 p-6">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
            placeholder="Escriba una consulta sobre la auditoría..."
            className="flex-1 rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-400/30"
          />

          <button
            onClick={() => sendMessage()}
            className="rounded-xl border border-blue-400/20 bg-blue-950/40 px-6 py-3 font-semibold text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.10)] transition duration-300 hover:bg-blue-900/40"
          >
            Enviar
          </button>
        </div>
      </div>
    </section>
  );
}

export default Chat;