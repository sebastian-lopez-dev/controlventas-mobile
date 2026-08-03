import { apiFetch } from "./api.js";

export async function mostrarHistorialPagosPrestamos(
  usuario,
  volverAlModulo
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverHistorialPagos"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Historial de pagos</h1>
          <p>Pagos registrados anteriormente</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarHistorialPago"
            placeholder="Buscar cliente o préstamo"
          >
        </div>

        <div id="listaHistorialPagos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando pagos...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverHistorialPagos")
    .addEventListener("click", volverAlModulo);

  try {
    const pagos = await apiFetch("/prestamos/pagos");

    renderizarHistorialPagos(pagos);
    activarBuscadorHistorialPagos();
  } catch (error) {
    document.querySelector("#listaHistorialPagos").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los pagos</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarHistorialPagos(pagos) {
  const contenedor = document.querySelector(
    "#listaHistorialPagos"
  );

  if (pagos.length === 0) {
    contenedor.innerHTML = `
      <div class="cobranza-vacia">
        <div>💵</div>
        <h2>No hay pagos registrados</h2>
        <p>
          Los pagos de los préstamos aparecerán aquí.
        </p>
      </div>
    `;
    return;
  }

  const totalCobrado = pagos.reduce(
    (total, pago) =>
      total + Number(pago.montoPago || 0),
    0
  );

  contenedor.innerHTML = `
    <div class="resumen-cobranza">
      <article>
        <span>Pagos registrados</span>
        <strong>${pagos.length}</strong>
      </article>

      <article>
        <span>Total cobrado</span>
        <strong>${formatearDinero(totalCobrado)}</strong>
      </article>
    </div>

    <div class="cantidad-resultados">
      ${pagos.length}
      ${pagos.length === 1 ? "pago" : "pagos"}
    </div>

    <div class="lista-cobranzas">
      ${pagos
        .map((pago) => {
          const prestamo = pago.prestamo || {};
          const cliente = prestamo.cliente || {};
          const nombreCliente =
            obtenerNombreCliente(cliente);

          const busqueda = [
            nombreCliente,
            prestamo.numeroPrestamo,
            cliente.dni,
            pago.fechaPago
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return `
            <article
              class="tarjeta-cobranza"
              data-busqueda-historial="${escaparTexto(
                busqueda
              )}"
            >
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    ${escaparTexto(
                      prestamo.numeroPrestamo ||
                        "PRÉSTAMO"
                    )}
                  </span>

                  <h2>${escaparTexto(nombreCliente)}</h2>
                </div>

                <span class="estado-cuota pagada">
                  PAGADO
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Monto pagado</span>
                  <strong>
                    ${formatearDinero(pago.montoPago)}
                  </strong>
                </div>

                <div>
                  <span>Saldo posterior</span>
                  <strong>
                    ${formatearDinero(
                      pago.saldoPosterior
                    )}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Fecha:</b>
                  ${formatearFecha(pago.fechaPago)}
                </p>

                <p>
                  <b>Saldo anterior:</b>
                  ${formatearDinero(
                    pago.saldoAnterior
                  )}
                </p>

                ${
                  pago.observaciones
                    ? `
                      <p>
                        <b>Observaciones:</b>
                        ${escaparTexto(
                          pago.observaciones
                        )}
                      </p>
                    `
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function activarBuscadorHistorialPagos() {
  const buscador = document.querySelector(
    "#buscarHistorialPago"
  );

  buscador.addEventListener("input", () => {
    const texto = normalizarTexto(buscador.value);

    document
      .querySelectorAll(
        "[data-busqueda-historial]"
      )
      .forEach((tarjeta) => {
        tarjeta.hidden = !normalizarTexto(
          tarjeta.dataset.busquedaHistorial
        ).includes(texto);
      });
  });
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

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}