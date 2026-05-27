const API_URL = "http://127.0.0.1:8000";
const USE_MOCK_FALLBACK = true;

const mockAuditResult = {
  source: "mock",
  cumplimiento_general: true,
  resultados_calculados: {
    porcentaje_administracion: 7.76,
    limite_administracion_valido: true,
    porcentaje_cuota_monetaria: 55.17,
    minimo_cuota_monetaria_valido: true,
  },
  analisis_cognitivo:
    "La auditoría simulada indica que la caja cumple con los límites establecidos. El porcentaje de gastos administrativos se mantiene por debajo del máximo permitido del 8%, y la cuota monetaria supera el mínimo requerido del 55%. Se recomienda mantener seguimiento mensual para detectar desviaciones tempranas.",
};

export async function auditFile(file, caja) {
  const formData = new FormData();
  formData.append("file", file);
  if (caja) {
    formData.append("caja", caja);
  }

  try {
    const response = await fetch(`${API_URL}/audit`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("El backend respondió con error");
    const data = await response.json();
    return { source: "backend", ...data };
  } catch (error) {
    console.warn("Backend no disponible. Usando respuesta mock temporal.");
    if (USE_MOCK_FALLBACK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockAuditResult), 1000);
      });
    }
    throw error;
  }
}

export async function getAuditorias() {
  try {
    const response = await fetch(`${API_URL}/auditorias`);
    if (!response.ok) throw new Error("El backend respondió con error al obtener el historial");
    return await response.json();
  } catch (error) {
    console.error("Backend no disponible. Retornando historial vacío.", error);
    return [];
  }
}

export async function sendChatMessage(mensaje, ccf) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje, ccf }),
    });
    if (!response.ok) throw new Error("Error en la respuesta del chat");
    const data = await response.json();
    return data.respuesta;
  } catch (error) {
    console.error("Error al enviar el mensaje de chat:", error);
    return "Lo siento, ha ocurrido un error al conectar con el servidor.";
  }
}

export async function loginUser(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Credenciales incorrectas");
    return await res.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function deleteAuditoria(id) {
  try {
    const res = await fetch(`${API_URL}/auditorias/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error eliminando reporte");
    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}