export const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080/api"
).replace(/\/+$/, "");

export async function apiFetch(
  ruta,
  opciones = {}
) {
  const token = localStorage.getItem(
    "controlventas_token"
  );

  const headers = new Headers(
    opciones.headers || {}
  );

  const esFormulario =
    opciones.body instanceof FormData;

  if (
    opciones.body &&
    !esFormulario
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const respuesta = await fetch(
    `${API_URL}${ruta}`,
    {
      ...opciones,
      headers
    }
  );

  if (respuesta.status === 401) {
    localStorage.removeItem(
      "controlventas_token"
    );

    localStorage.removeItem(
      "controlventas_usuario"
    );

    throw new Error(
      "Tu sesión terminó. Vuelve a ingresar."
    );
  }

  if (respuesta.status === 204) {
    return null;
  }

  const tipoContenido =
    respuesta.headers.get(
      "content-type"
    );

  let datos;

  if (
    tipoContenido &&
    tipoContenido.includes(
      "application/json"
    )
  ) {
    datos = await respuesta.json();

  } else {
    datos = await respuesta.text();
  }

  if (!respuesta.ok) {
    const mensaje =
      datos?.mensaje ||
      datos?.detail ||
      datos?.message ||
      datos?.error ||
      (
        typeof datos === "string" &&
        datos.trim()
          ? datos
          : null
      ) ||
      `No se pudo completar la operación. Error ${respuesta.status}`;

    throw new Error(mensaje);
  }

  return datos;
}