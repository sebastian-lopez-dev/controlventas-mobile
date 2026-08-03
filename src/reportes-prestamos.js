import { apiFetch } from "./api.js";

export async function mostrarReportesPrestamos(
  usuario,
  volverAlModulo
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverReportesPrestamos"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Reportes</h1>
          <p>Resumen del negocio de préstamos</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div id="contenidoReportesPrestamos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando reporte...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverReportesPrestamos")
    .addEventListener("click", volverAlModulo);

  try {
    const [prestamos, pagos] = await Promise.all([
      apiFetch("/prestamos"),
      apiFetch("/prestamos/pagos")
    ]);

    renderizarReportesPrestamos(prestamos, pagos);
  } catch (error) {
    document.querySelector(
      "#contenidoReportesPrestamos"
    ).innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudo cargar el reporte</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarReportesPrestamos(
  prestamos,
  pagos
) {
  const totalCapital = prestamos.reduce(
    (total, prestamo) =>
      total + Number(prestamo.montoCapital || 0),
    0
  );

  const totalIntereses = prestamos.reduce(
    (total, prestamo) =>
      total + Number(prestamo.montoInteres || 0),
    0
  );

  const deudaTotal = prestamos.reduce(
    (total, prestamo) =>
      total + Number(prestamo.deudaTotal || 0),
    0
  );

  const saldoPendiente = prestamos.reduce(
    (total, prestamo) =>
      total + Number(prestamo.saldoPendiente || 0),
    0
  );

  const totalCobrado = pagos.reduce(
    (total, pago) =>
      total + Number(pago.montoPago || 0),
    0
  );

  const prestamosActivos = prestamos.filter(
    (prestamo) =>
      Number(prestamo.saldoPendiente || 0) > 0
  ).length;

  const prestamosFinalizados = prestamos.filter(
    (prestamo) =>
      Number(prestamo.saldoPendiente || 0) === 0
  ).length;

  const porcentajeCobrado =
    deudaTotal > 0
      ? (totalCobrado / deudaTotal) * 100
      : 0;

  const prestamosRecientes = prestamos.slice(0, 5);

  document.querySelector(
    "#contenidoReportesPrestamos"
  ).innerHTML = `
    <div class="titulo-seccion" style="margin-top: 0;">
      <h2>Resumen general</h2>
      <p>Situación actual de los préstamos</p>
    </div>

    <div class="resumen-cobranza">
      <article>
        <span>Capital prestado</span>
        <strong>${formatearDinero(totalCapital)}</strong>
      </article>

      <article>
        <span>Total cobrado</span>
        <strong>${formatearDinero(totalCobrado)}</strong>
      </article>
    </div>

    <div class="resumen-cobranza" style="margin-top: 11px;">
      <article>
        <span>Intereses generados</span>
        <strong>${formatearDinero(totalIntereses)}</strong>
      </article>

      <article>
        <span>Saldo pendiente</span>
        <strong>${formatearDinero(saldoPendiente)}</strong>
      </article>
    </div>

    <div class="titulo-seccion">
      <h2>Estado de los préstamos</h2>
      <p>Préstamos activos y completamente pagados</p>
    </div>

    <div class="datos-cobranza">
      <div>
        <span>Préstamos activos</span>
        <strong>${prestamosActivos}</strong>
      </div>

      <div>
        <span>Préstamos finalizados</span>
        <strong>${prestamosFinalizados}</strong>
      </div>
    </div>

    <article
      class="tarjeta-cobranza"
      style="margin-top: 12px;"
    >
      <div class="informacion-cliente" style="margin-top: 0; padding-top: 0; border: 0;">
        <p>
          <b>Préstamos registrados:</b>
          ${prestamos.length}
        </p>

        <p>
          <b>Pagos registrados:</b>
          ${pagos.length}
        </p>

        <p>
          <b>Deuda total generada:</b>
          ${formatearDinero(deudaTotal)}
        </p>

        <p>
          <b>Porcentaje cobrado:</b>
          ${porcentajeCobrado.toFixed(1)}%
        </p>
      </div>
    </article>

    <div class="titulo-seccion">
      <h2>Préstamos recientes</h2>
      <p>Últimos préstamos registrados</p>
    </div>

    ${
      prestamosRecientes.length === 0
        ? `
          <div class="cobranza-vacia">
            <div>📊</div>
            <h2>No hay información</h2>
            <p>
              El reporte se completará cuando registres préstamos.
            </p>
          </div>
        `
        : `
          <div class="lista-cobranzas">
            ${prestamosRecientes
              .map((prestamo) => {
                const cliente = prestamo.cliente || {};

                return `
                  <article class="tarjeta-cobranza">
                    <div class="cobranza-encabezado">
                      <div>
                        <span class="codigo-cliente">
                          ${escaparTexto(
                            prestamo.numeroPrestamo ||
                              "SIN NÚMERO"
                          )}
                        </span>

                        <h2>
                          ${escaparTexto(
                            obtenerNombreCliente(cliente)
                          )}
                        </h2>
                      </div>

                      <span class="estado-cuota ${
                        Number(
                          prestamo.saldoPendiente || 0
                        ) > 0
                          ? "pendiente"
                          : "pagada"
                      }">
                        ${
                          Number(
                            prestamo.saldoPendiente || 0
                          ) > 0
                            ? "ACTIVO"
                            : "FINALIZADO"
                        }
                      </span>
                    </div>

                    <div class="datos-cobranza">
                      <div>
                        <span>Capital</span>
                        <strong>
                          ${formatearDinero(
                            prestamo.montoCapital
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Pendiente</span>
                        <strong>
                          ${formatearDinero(
                            prestamo.saldoPendiente
                          )}
                        </strong>
                      </div>
                    </div>

                    <div class="informacion-cliente">
                      <p>
                        <b>Desembolso:</b>
                        ${formatearFecha(
                          prestamo.fechaDesembolso
                        )}
                      </p>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        `
    }
  `;
}

function obtenerNombreCliente(cliente) {
  const nombre = [
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno
  ]
    .filter(Boolean)
    .join(" ");

  return nombre || "Cliente";
}

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString(
    "es-PE",
    {
      style: "currency",
      currency: "PEN"
    }
  );
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "No registrada";
  }

  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString("es-PE");
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}