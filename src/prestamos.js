import { apiFetch } from "./api.js";
import { mostrarNuevoPrestamo } from "./nuevo-prestamo.js";
import { mostrarDetallePrestamo } from "./detalle-prestamo.js";
export async function mostrarPrestamos(
    usuario,
    volverAlModulo
) {
    document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverPrestamos"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Préstamos</h1>
            <p>Préstamos activos y finalizados</p>
          </div>

          <button
            type="button"
            id="btnNuevoPrestamo"
            class="btn-agregar-cabecera"
          >
            + Nuevo
          </button>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarPrestamo"
            placeholder="Buscar cliente, DNI o préstamo"
          >
        </div>

        <div id="listaPrestamos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando préstamos...</p>
          </div>
        </div>
      </section>
    </main>
  `;

    document
        .querySelector("#btnVolverPrestamos")
        .addEventListener("click", volverAlModulo);

    document
        .querySelector("#btnNuevoPrestamo")
        .addEventListener("click", () => {
            mostrarNuevoPrestamo(
                usuario,
                () => mostrarPrestamos(usuario, volverAlModulo)
            );
        });

    try {
        const prestamos = await apiFetch("/prestamos");

        renderizarPrestamos(prestamos);
        activarBuscadorPrestamos();

        document
            .querySelectorAll("[data-busqueda-prestamo]")
            .forEach((tarjeta, indice) => {
                tarjeta.style.cursor = "pointer";

                tarjeta.addEventListener("click", () => {
                    mostrarDetallePrestamo(
                        usuario,
                        prestamos[indice],
                        () => mostrarPrestamos(usuario, volverAlModulo)
                    );
                });
            });

        document
            .querySelectorAll("[data-eliminar-prestamo]")
            .forEach((boton) => {
                boton.addEventListener("click", async (evento) => {
                    evento.stopPropagation();

                    const idPrestamo = boton.dataset.eliminarPrestamo;

                    const confirmar = window.confirm(
                        "¿Seguro que deseas eliminar este préstamo? También se eliminarán sus cuotas y pagos."
                    );

                    if (!confirmar) {
                        return;
                    }

                    boton.disabled = true;
                    boton.textContent = "Eliminando...";

                    try {
                        await apiFetch(`/prestamos/${idPrestamo}`, {
                            method: "DELETE"
                        });

                        mostrarPrestamos(usuario, volverAlModulo);
                    } catch (error) {
                        boton.disabled = false;
                        boton.textContent = "Eliminar préstamo";

                        window.alert(
                            error.message || "No se pudo eliminar el préstamo."
                        );
                    }
                });
            });
    } catch (error) {
        document.querySelector("#listaPrestamos").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los préstamos</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
    }
}

function renderizarPrestamos(prestamos) {
    const lista = document.querySelector("#listaPrestamos");

    if (prestamos.length === 0) {
        lista.innerHTML = `
      <div class="cobranza-vacia">
        <div>💰</div>
        <h2>No hay préstamos registrados</h2>
        <p>
          Los préstamos que registre tu papá aparecerán aquí.
        </p>
      </div>
    `;

        return;
    }

    lista.innerHTML = `
    <div class="cantidad-resultados">
      ${prestamos.length}
      ${prestamos.length === 1 ? "préstamo" : "préstamos"}
    </div>

    <div class="lista-cobranzas">
      ${prestamos
            .map((prestamo) => {
                const cliente = prestamo.cliente || {};
                const nombreCliente = obtenerNombreCliente(cliente);

                const busqueda = [
                    prestamo.numeroPrestamo,
                    nombreCliente,
                    cliente.dni,
                    prestamo.estado
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return `
            <article
              class="tarjeta-cobranza"
              data-busqueda-prestamo="${escaparTexto(busqueda)}"
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

                <span class="estado-cuota ${obtenerClaseEstado(
                    prestamo.estado
                )}">
                  ${escaparTexto(prestamo.estado || "ACTIVO")}
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Capital prestado</span>
                  <strong>
                    ${formatearDinero(prestamo.montoCapital)}
                  </strong>
                </div>

                <div>
                  <span>Saldo pendiente</span>
                  <strong>
                    ${formatearDinero(prestamo.saldoPendiente)}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Deuda total:</b>
                  ${formatearDinero(prestamo.deudaTotal)}
                </p>

                <p>
                  <b>Interés:</b>
                  ${Number(prestamo.porcentajeInteres || 0)}%
                </p>

                <p>
                  <b>Modalidad:</b>
                  ${escaparTexto(prestamo.modalidadPago || "No registrada")}
                </p>

                <p>
                  <b>Cuota:</b>
                  ${formatearDinero(prestamo.montoCuota)}
                </p>

                <p>
                  <b>Fecha de desembolso:</b>
                  ${formatearFecha(prestamo.fechaDesembolso)}
                </p>
                            </div>

              <button
                type="button"
                data-eliminar-prestamo="${prestamo.idPrestamo}"
                style="
                  width: 100%;
                  margin-top: 16px;
                  padding: 12px;
                  border: 1px solid #dc2626;
                  border-radius: 10px;
                  background: white;
                  color: #dc2626;
                  font-size: 15px;
                  font-weight: 700;
                  cursor: pointer;
                "
              >
                Eliminar préstamo
              </button>
            </article>
          `;
            })
            .join("")}
    </div>
  `;
}

function activarBuscadorPrestamos() {
    const buscador = document.querySelector("#buscarPrestamo");

    buscador.addEventListener("input", () => {
        const texto = normalizarTexto(buscador.value);

        document
            .querySelectorAll("[data-busqueda-prestamo]")
            .forEach((tarjeta) => {
                tarjeta.hidden = !normalizarTexto(
                    tarjeta.dataset.busquedaPrestamo
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

function obtenerClaseEstado(estado) {
    const estadoNormalizado = String(
        estado || ""
    ).toUpperCase();

    if (estadoNormalizado === "FINALIZADO") {
        return "pagada";
    }

    if (estadoNormalizado === "VENCIDO") {
        return "vencida";
    }

    return "pendiente";
}

function formatearDinero(valor) {
    return Number(valor || 0).toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN"
    });
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "No registrada";
    }

    return new Date(`${fecha}T00:00:00`).toLocaleDateString(
        "es-PE"
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