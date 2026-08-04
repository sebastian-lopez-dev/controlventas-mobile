import { apiFetch } from "./api.js";
import { mostrarFormularioCliente } from "./clientes.js";
export async function mostrarClientesPrestamos(
    usuario,
    volverAlModulo
) {
    document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverClientesPrestamos"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
  <div>
    <h1>Clientes</h1>
    <p>Clientes que recibieron préstamos</p>
  </div>

  <button
    type="button"
    id="btnNuevoClientePrestamo"
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
            id="buscarClientePrestamo"
            placeholder="Buscar cliente, DNI o código"
          >
        </div>

        <div id="listaClientesPrestamos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando clientes...</p>
          </div>
        </div>
      </section>
    </main>
  `;

    document
        .querySelector("#btnVolverClientesPrestamos")
        .addEventListener("click", volverAlModulo);

    document
        .querySelector("#btnNuevoClientePrestamo")
        .addEventListener("click", () => {
            mostrarFormularioCliente(
                null,
                () =>
                    mostrarClientesPrestamos(
                        usuario,
                        volverAlModulo
                    )
            );
        });

    try {
        const prestamos = await apiFetch("/prestamos");

        const clientes = agruparClientesPrestamos(prestamos);

        renderizarClientesPrestamos(clientes);
        activarBuscadorClientesPrestamos();
    } catch (error) {
        document.querySelector(
            "#listaClientesPrestamos"
        ).innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los clientes</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
    }
}

function agruparClientesPrestamos(prestamos) {
    const clientesAgrupados = new Map();

    prestamos.forEach((prestamo) => {
        const cliente = prestamo.cliente;

        if (!cliente?.idCliente) {
            return;
        }

        if (!clientesAgrupados.has(cliente.idCliente)) {
            clientesAgrupados.set(cliente.idCliente, {
                ...cliente,
                cantidadPrestamos: 0,
                prestamosActivos: 0,
                totalPrestado: 0,
                saldoPendiente: 0
            });
        }

        const clienteAgrupado = clientesAgrupados.get(
            cliente.idCliente
        );

        clienteAgrupado.cantidadPrestamos += 1;

        clienteAgrupado.totalPrestado += Number(
            prestamo.montoCapital || 0
        );

        clienteAgrupado.saldoPendiente += Number(
            prestamo.saldoPendiente || 0
        );

        if (Number(prestamo.saldoPendiente || 0) > 0) {
            clienteAgrupado.prestamosActivos += 1;
        }
    });

    return [...clientesAgrupados.values()].sort(
        (clienteA, clienteB) =>
            obtenerNombreCliente(clienteA).localeCompare(
                obtenerNombreCliente(clienteB)
            )
    );
}

function renderizarClientesPrestamos(clientes) {
    const contenedor = document.querySelector(
        "#listaClientesPrestamos"
    );

    if (clientes.length === 0) {
        contenedor.innerHTML = `
      <div class="cobranza-vacia">
        <div>👥</div>
        <h2>No hay clientes con préstamos</h2>
        <p>
          Los clientes aparecerán cuando se registre
          su primer préstamo.
        </p>
      </div>
    `;

        return;
    }

    contenedor.innerHTML = `
    <div class="cantidad-resultados">
      ${clientes.length}
      ${clientes.length === 1 ? "cliente" : "clientes"}
    </div>

    <div class="lista-cobranzas">
      ${clientes
            .map((cliente) => {
                const nombre = obtenerNombreCliente(cliente);

                const busqueda = [
                    nombre,
                    cliente.codigoCliente,
                    cliente.dni,
                    cliente.celular,
                    cliente.zona
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return `
            <article
              class="tarjeta-cobranza"
              data-busqueda-cliente-prestamo="${escaparTexto(
                    busqueda
                )}"
            >
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    ${escaparTexto(
                    cliente.codigoCliente || "SIN CÓDIGO"
                )}
                  </span>

                  <h2>${escaparTexto(nombre)}</h2>
                </div>

                <span class="estado-cuota ${cliente.prestamosActivos > 0
                        ? "pendiente"
                        : "pagada"
                    }">
                  ${cliente.prestamosActivos > 0
                        ? "CON DEUDA"
                        : "AL DÍA"
                    }
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Total prestado</span>
                  <strong>
                    ${formatearDinero(
                        cliente.totalPrestado
                    )}
                  </strong>
                </div>

                <div>
                  <span>Saldo pendiente</span>
                  <strong>
                    ${formatearDinero(
                        cliente.saldoPendiente
                    )}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Préstamos registrados:</b>
                  ${cliente.cantidadPrestamos}
                </p>

                <p>
                  <b>Préstamos activos:</b>
                  ${cliente.prestamosActivos}
                </p>

                <p>
                  <b>DNI:</b>
                  ${escaparTexto(
                        cliente.dni || "No registrado"
                    )}
                </p>

                <p>
                  <b>Celular:</b>
                  ${escaparTexto(
                        cliente.celular || "No registrado"
                    )}
                </p>

                <p>
                  <b>Dirección:</b>
                  ${escaparTexto(
                        cliente.direccion || "No registrada"
                    )}
                </p>

                <p>
                  <b>Zona:</b>
                  ${escaparTexto(
                        cliente.zona || "No registrada"
                    )}
                </p>
              </div>
            </article>
          `;
            })
            .join("")}
    </div>
  `;
}

function activarBuscadorClientesPrestamos() {
    const buscador = document.querySelector(
        "#buscarClientePrestamo"
    );

    buscador.addEventListener("input", () => {
        const texto = normalizarTexto(buscador.value);

        document
            .querySelectorAll(
                "[data-busqueda-cliente-prestamo]"
            )
            .forEach((tarjeta) => {
                tarjeta.hidden = !normalizarTexto(
                    tarjeta.dataset.busquedaClientePrestamo
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