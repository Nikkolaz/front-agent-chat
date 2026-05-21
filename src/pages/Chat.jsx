import { useState } from "react";

const quickQuestions = [
  "¿La caja cumple con Ley 21?",
  "Resume las alertas principales",
  "¿Qué indicador está en riesgo?",
];

function Chat() {
  const [selectedCaja, setSelectedCaja] = useState("Colsubsidio");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Hola, soy el agente IA de auditoría. Selecciona una caja y hazme una pregunta.",
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
      text: `Análisis simulado para ${selectedCaja}: el indicador de gastos administrativos está dentro del rango permitido, pero se recomienda revisar variaciones mensuales.`,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      agentMessage,
    ]);

    setMessage("");
  };

  return (
    <section className="grid h-[calc(100vh-4rem)] gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-400">
          Agente IA
        </p>

        <h2 className="mt-2 text-3xl font-bold">Chat</h2>

        <p className="mt-2 text-sm text-gray-400">
          Consulta resultados de auditoría por caja.
        </p>

        <label className="mt-6 block text-sm text-gray-300">
          Caja seleccionada
        </label>

        <select
          value={selectedCaja}
          onChange={(event) => setSelectedCaja(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white outline-none"
        >
          <option>Colsubsidio</option>
          <option>Cafam</option>
          <option>Comfandi</option>
          <option>Compensar</option>
        </select>

        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-400">Preguntas rápidas</p>

          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => sendMessage(question)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition duration-300 hover:border-purple-400 hover:bg-purple-500/10 hover:text-white"
            >
              {question}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="border-b border-white/10 p-5">
          <h3 className="text-xl font-semibold">
            Conversación con auditor IA
          </h3>
          <p className="text-sm text-gray-400">
            Contexto actual: {selectedCaja}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((item, index) => (
            <div
              key={index}
              className={`flex ${item.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${item.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "border border-white/10 bg-white/10 text-gray-200"
                  }`}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 border-t border-white/10 p-5">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
            placeholder="Escribe una pregunta sobre la auditoría..."
            className="flex-1 rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white outline-none placeholder:text-gray-500"
          />

          <button
            onClick={() => sendMessage()}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold transition duration-300 hover:scale-105"
          >
            Enviar
          </button>
        </div>
      </div>
    </section>
  );
}

export default Chat;