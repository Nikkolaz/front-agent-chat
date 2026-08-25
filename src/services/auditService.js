const API_URL = "http://localhost:8000";
const USE_MOCK_FALLBACK = false;

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

/**
 * Envía 1 o más archivos al endpoint /audit.
 * @param {File|File[]} files - Archivo único o array de archivos (máx 5).
 * @param {string} caja - Nombre de la caja (opcional, se autodetecta).
 */
export async function auditFile(files, caja) {
  const formData = new FormData();

  // Soportar tanto File individual como Array de Files
  const fileList = Array.isArray(files) ? files : [files];
  fileList.forEach((f) => formData.append("files", f));

  if (caja) {
    formData.append("caja", caja);
  }

  try {
    const response = await fetch(`${API_URL}/audit`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.detail || "El backend respondió con error");
    }
    const data = await response.json();
    return { source: "backend", ...data };
  } catch (error) {
    console.warn("Backend no disponible o error:", error.message);
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

export async function getAuditoriaById(id) {
  try {
    const response = await fetch(`${API_URL}/auditorias/${id}`);
    if (!response.ok) throw new Error("El backend respondió con error al obtener el reporte");
    return await response.json();
  } catch (error) {
    console.error("Error al obtener el reporte:", error);
    return null;
  }
}

export async function sendChatMessage(mensaje, ccf, auditoriaId = null) {
  try {
    const body = { mensaje, ccf };
    if (auditoriaId) body.auditoria_id = auditoriaId;

    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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


// ══════════════════════════════════════════════════════════════
// NUEVAS FUNCIONES PARA MULTI-AUDITORÍA
// ══════════════════════════════════════════════════════════════

/**
 * Obtiene el listado de sesiones de auditoría batch.
 */
export async function getSesiones() {
  try {
    const response = await fetch(`${API_URL}/sesiones`);
    if (!response.ok) throw new Error("Error al obtener sesiones");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo sesiones:", error);
    return [];
  }
}

/**
 * Obtiene el detalle de una sesión con todos sus reportes.
 */
export async function getSesionById(id) {
  try {
    const response = await fetch(`${API_URL}/sesiones/${id}`);
    if (!response.ok) throw new Error("Error al obtener sesión");
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo sesión:", error);
    return null;
  }
}

/**
 * Envía un mensaje de chat con contexto de toda la sesión.
 */
export async function sendChatMulti(mensaje, sesionId) {
  try {
    const response = await fetch(`${API_URL}/chat-multi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje, sesion_id: sesionId }),
    });
    if (!response.ok) throw new Error("Error en chat multi");
    const data = await response.json();
    return data.respuesta;
  } catch (error) {
    console.error("Error en chat multi:", error);
    return "Lo siento, ha ocurrido un error al conectar con el servidor.";
  }
}

/**
 * Envía un mensaje de chat con contexto global de toda la BD.
 */
export async function sendChatGlobal(mensaje) {
  try {
    const response = await fetch(`${API_URL}/chat-global`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.detail || "Error en chat global");
    }
    const data = await response.json();
    return data.respuesta;
  } catch (error) {
    console.error("Error en chat global:", error);
    return `Lo siento: ${error.message}`;
  }
}

// ══════════════════════════════════════════════════════════════
// NUEVAS FUNCIONES PARA CONFIGURACIÓN (SUPER ADMIN)
// ══════════════════════════════════════════════════════════════

export async function getSystemConfig() {
  const response = await fetch(`${API_URL}/api/config`);
  if (!response.ok) throw new Error("Error al obtener configuración");
  return await response.json();
}

export async function updateSystemConfig(config) {
  const response = await fetch(`${API_URL}/api/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!response.ok) throw new Error("Error al actualizar configuración");
  return await response.json();
}

export async function reprocesarHistorial() {
  const response = await fetch(`${API_URL}/api/reprocesar`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error("Error al iniciar reprocesamiento");
  return await response.json();
}
export async function sendValidatorChat(reporteId, mensaje, historial) {
  try {
    const response = await fetch(`${API_URL}/chat-validador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporte_id: reporteId, mensaje, historial }),
    });
    if (!response.ok) throw new Error('Error en chat validador');
    const data = await response.json();
    return data.respuesta;
  } catch (error) {
    console.error('Error en chat validador:', error);
    return 'Lo siento, ha ocurrido un error al conectar con el servidor.';
  }
}

