export async function auditFile(file) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/audit", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("No se pudo procesar el archivo en el backend");
    }

    const data = await response.json();

    return data;
}