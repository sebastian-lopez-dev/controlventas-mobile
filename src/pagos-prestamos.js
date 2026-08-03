import { apiFetch } from "./api.js";
import { mostrarRegistrarPagoPrestamo } from "./registrar-pago-prestamo.js";

export async function mostrarPagosPrestamos(
  usuario,
  volverAlModulo
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverPagosPrestamos"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Registrar pago</h1>
          <p>Selecciona el préstamo que deseas cobrar</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarPrestamoPago"
            placeholder="Buscar cliente, DNI o préstamo"
          >
        </div>

        <div id="listaPrestamosPago">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando préstamos pendientes...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverPagosPrestamos")
    .addEventListener("click", volverAlModulo);

  try {
    const prestamos = await apiFetch("/prestamos");

    const prestamosPendientes = prestamos.filter(
      (prestamo) =>
        Number(prestamo.saldoPendiente || 0) > 0 &&
        String(prestamo.estado || "").toUpperCase() !==
          "FINALIZADO"
    );

    renderizarPrestamosParaPago(
      prestamosPendientes,
      usuario,
      volverAlModulo
    );

    activarBuscadorPagos();
  } catch (error) {
    document.querySelector("#listaPrestamosPago").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los préstamos</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarPrestamosParaPago(
  prestamos,
  usuario,
  volverAlModulo
) {
  const lista = document.querySelector(
    "#listaPrestamosPago"
  );

  if (prestamos.length === 0) {
    lista.innerHTML = `
      <div class="cobranza-vacia">
        <div>✅</div>
        <h2>No hay pagos pendientes</h2>
        <p>
          Todos los préstamos registrados están pagados.
        </p>
      </div>
    `;

    return;
  }

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${prestamos.length}
      ${
        prestamos.length === 1
          ? "préstamo pendiente"
          : "préstamos pendientes"
      }
    </div>

    <div class="lista-cobranzas">
      ${prestamos
        .map((prestamo, indice) => {
          const cliente = prestamo.cliente || {};
          const nombreCliente =
            obtenerNombreCliente(cliente);

          const busqueda = [
            prestamo.numeroPrestamo,
            nombreCliente,
            cliente.dni,
            cliente.codigoCliente
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return `
            <article
              class="tarjeta-cobranza"
              data-indice-pago="${indice}"
              data-busqueda-pago="${escaparTexto(busqueda)}"
              style="cursor: pointer;"
            >
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    ${escaparTexto(
                      prestamo.numeroPrestamo || "SIN NÚMERO"
                    )}
                  </span>

                  <h2>${escaparTexto(nombreCliente)}</h2>
                </div>

                <span class="estado-cuota pendiente">
                  PENDIENTE
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Cuota habitual</span>
                  <strong>
                    ${formatearDinero(prestamo.montoCuota)}
                  </strong>
                </div>

                <div>
                  <span>Saldo pendiente</span>
                  <strong>
                    ${formatearDinero(
                      prestamo.saldoPendiente
                    )}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Modalidad:</b>
                  ${escaparTexto(
                    prestamo.modalidadPago || "No registrada"
                  )}
                </p>

                <p>
                  <b>DNI:</b>
                  ${escaparTexto(
                    cliente.dni || "No registrado"
                  )}
                </p>

                <p>
                  <b>Selecciona para registrar el pago</b>
                </p>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  document
    .querySelectorAll("[data-indice-pago]")
    .forEach((tarjeta) => {
      tarjeta.addEventListener("click", () => {
        const indice = Number(
          tarjeta.dataset.indicePago
        );

        const prestamoSeleccionado =
          prestamos[indice];

        mostrarRegistrarPagoPrestamo(
          usuario,
          prestamoSeleccionado,
          () =>
            mostrarPagosPrestamos(
              usuario,
              volverAlModulo
            )
        );
      });
    });
}

function activarBuscadorPagos() {
  const buscador = document.querySelector(
    "#buscarPrestamoPago"
  );

  buscador.addEventListener("input", () => {
    const texto = normalizarTexto(buscador.value);

    document
      .querySelectorAll("[data-busqueda-pago]")
      .forEach((tarjeta) => {
        tarjeta.hidden = !normalizarTexto(
          tarjeta.dataset.busquedaPago
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