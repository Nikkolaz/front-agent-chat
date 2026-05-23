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

export async function auditFile(file) {
    const formData = new FormData();

    formData.append("file", file);

    try {
        const response = await fetch("http://127.0.0.1:8000/audit", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("El backend respondió con error");
        }

        const data = await response.json();

        return {
            source: "backend",
            ...data,
        };
    } catch (error) {
        console.warn("Backend no disponible. Usando respuesta mock temporal.");

        if (USE_MOCK_FALLBACK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(mockAuditResult);
                }, 1000);
            });
        }

        throw error;
    }
}