import { apiFetch } from "./api.js";

export async function mostrarNuevoPrestamo(
    usuario,
    volverALista
) {
    document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverNuevoPrestamo"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Nuevo préstamo</h1>
          <p>Registra un préstamo en efectivo</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <form id="formNuevoPrestamo" class="formulario-login">

          <div class="campo">
            <label for="buscarClientePrestamo">Cliente</label>

            <div class="buscador-contrato">
              <span aria-hidden="true">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="display: block"
                >
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="m20 20-4-4"></path>
                </svg>
              </span>

              <input
                type="search"
                id="buscarClientePrestamo"
                placeholder="Buscar por nombre, apellido, DNI o código"
                autocomplete="off"
              >
            </div>

            <p
              id="resultadoBusquedaPrestamo"
              class="resultado-buscador-contrato"
              aria-live="polite"
            ></p>

            <select id="prestamoCliente" required>
              <option value="">Cargando clientes...</option>
            </select>
          </div>

          <div class="campo">
            <label for="prestamoCapital">
              Crédito capital
            </label>

            <input
              type="number"
              id="prestamoCapital"
              min="1"
              step="0.01"
              placeholder="Ejemplo: 600"
              required
            >
          </div>

          <div class="campo">
            <label for="prestamoInteres">
              Interés
            </label>

            <select id="prestamoInteres" required>
              <option value="10">10%</option>
              <option value="20" selected>20%</option>
              <option value="30">30%</option>
              <option value="40">40%</option>
            </select>
          </div>

          <div class="datos-cobranza">
            <div>
              <span>Interés calculado</span>
              <strong id="interesCalculado">
                S/ 0.00
              </strong>
            </div>

            <div>
              <span>Deuda total</span>
              <strong id="deudaTotalPrestamo">
                S/ 0.00
              </strong>
            </div>
          </div>

          <div class="campo">
            <label for="prestamoModalidad">
              Modalidad de pago
            </label>

            <select id="prestamoModalidad" required>
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>

          <div class="campo">
            <label for="prestamoCuota">
              Monto de la cuota
            </label>

            <input
              type="number"
              id="prestamoCuota"
              min="0.01"
              step="0.01"
              placeholder="Ejemplo: 15"
              required
            >
          </div>

          <div class="campo">
            <label for="fechaDesembolsoPrestamo">
              Fecha de desembolso
            </label>

            <input
              type="date"
              id="fechaDesembolsoPrestamo"
              required
            >
          </div>

          <div class="campo">
            <label for="fechaPrimerPagoPrestamo">
              Fecha del primer pago
            </label>

            <input
              type="date"
              id="fechaPrimerPagoPrestamo"
              required
            >
          </div>

          <div class="campo">
            <label for="observacionesPrestamo">
              Observaciones
            </label>

            <textarea
              id="observacionesPrestamo"
              rows="4"
              placeholder="Información adicional del préstamo"
            ></textarea>
          </div>

          <button
            type="submit"
            class="btn-ver-cobros"
          >
            Guardar préstamo
          </button>

          <p
            id="mensajeNuevoPrestamo"
            class="aviso-accion"
          ></p>
        </form>
      </section>
    </main>
  `;

    document
        .querySelector("#btnVolverNuevoPrestamo")
        .addEventListener("click", volverALista);

    colocarFechasPrestamo();
    activarCalculoPrestamo();
    activarFormularioPrestamo(volverALista);

    await cargarClientesPrestamo();
}

async function cargarClientesPrestamo() {
    const selector = document.querySelector(
        "#prestamoCliente"
    );
    const buscador = document.querySelector(
        "#buscarClientePrestamo"
    );
    const resultado = document.querySelector(
        "#resultadoBusquedaPrestamo"
    );

    try {
        const clientes = await apiFetch("/clientes");

        const clientesActivos = clientes.filter(
            (cliente) => cliente.activo
        );

        const cargarOpciones = (clientesFiltrados) => {
            const idSeleccionado = Number(selector.value);

            selector.innerHTML = `
        <option value="">
          ${clientesFiltrados.length
                    ? "Selecciona un cliente"
                    : "No se encontraron clientes"}
        </option>

        ${clientesFiltrados
                .map(
                    (cliente) => `
              <option value="${cliente.idCliente}">
                ${escaparTexto(obtenerNombreCliente(cliente))}
                ${cliente.dni
                            ? `- DNI ${escaparTexto(cliente.dni)}`
                            : ""}
              </option>
            `
                )
                .join("")}
      `;

            selector.disabled = clientesFiltrados.length === 0;

            const conservaSeleccion = clientesFiltrados.some(
                (cliente) =>
                    Number(cliente.idCliente) === idSeleccionado
            );

            if (conservaSeleccion) {
                selector.value = String(idSeleccionado);
            } else if (clientesFiltrados.length === 1) {
                selector.value = String(clientesFiltrados[0].idCliente);
            }
        };

        const filtrarClientes = () => {
            const texto = normalizarBusqueda(buscador.value);

            const clientesFiltrados = clientesActivos.filter(
                (cliente) => {
                    const datosBusqueda = [
                        obtenerNombreCliente(cliente),
                        cliente.dni,
                        cliente.codigoCliente
                    ]
                        .filter(Boolean)
                        .join(" ");

                    return normalizarBusqueda(datosBusqueda)
                        .includes(texto);
                }
            );

            cargarOpciones(clientesFiltrados);

            resultado.textContent = texto
                ? `${clientesFiltrados.length} ${
                    clientesFiltrados.length === 1
                        ? "cliente encontrado"
                        : "clientes encontrados"
                }`
                : "";
        };

        cargarOpciones(clientesActivos);
        buscador.addEventListener("input", filtrarClientes);
    } catch (error) {
        selector.innerHTML = `
      <option value="">
        No se pudieron cargar los clientes
      </option>
    `;
    }
}

function activarCalculoPrestamo() {
    const capital = document.querySelector(
        "#prestamoCapital"
    );

    const porcentaje = document.querySelector(
        "#prestamoInteres"
    );

    const calcular = () => {
        const montoCapital = Number(capital.value || 0);
        const interesPorcentaje = Number(
            porcentaje.value || 0
        );

        const interes =
            montoCapital * (interesPorcentaje / 100);

        const deudaTotal =
            montoCapital + interes;

        document.querySelector(
            "#interesCalculado"
        ).textContent = formatearDinero(interes);

        document.querySelector(
            "#deudaTotalPrestamo"
        ).textContent = formatearDinero(deudaTotal);
    };

    capital.addEventListener("input", calcular);
    porcentaje.addEventListener("change", calcular);
}

function activarFormularioPrestamo(volverALista) {
    document
        .querySelector("#formNuevoPrestamo")
        .addEventListener("submit", async (evento) => {
            evento.preventDefault();
            const formulario = evento.currentTarget;

            const mensaje = document.querySelector(
                "#mensajeNuevoPrestamo"
            );

            const botonGuardar = formulario.querySelector('button[type="submit"]'
            );

            const datosPrestamo = {
                idCliente: Number(
                    document.querySelector("#prestamoCliente").value
                ),
                montoCapital: Number(
                    document.querySelector("#prestamoCapital").value
                ),
                porcentajeInteres: Number(
                    document.querySelector("#prestamoInteres").value
                ),
                modalidadPago: document.querySelector(
                    "#prestamoModalidad"
                ).value,
                montoCuota: Number(
                    document.querySelector("#prestamoCuota").value
                ),
                fechaDesembolso: document.querySelector(
                    "#fechaDesembolsoPrestamo"
                ).value,
                fechaPrimerPago: document.querySelector(
                    "#fechaPrimerPagoPrestamo"
                ).value,
                observaciones:
                    document
                        .querySelector("#observacionesPrestamo")
                        .value
                        .trim() || null
            };

            try {
                botonGuardar.disabled = true;
                botonGuardar.textContent = "Guardando...";
                mensaje.textContent = "";

                await apiFetch(
                    "/prestamos",
                    {
                        method: "POST",
                        body: JSON.stringify(datosPrestamo)
                    }
                );

                volverALista();
            } catch (error) {
                mensaje.textContent = error.message;
            } finally {
                botonGuardar.disabled = false;
                botonGuardar.textContent = "Guardar préstamo";
            }
        });
}

function colocarFechasPrestamo() {
    const hoy = new Date();

    const fechaHoy = convertirFechaInput(hoy);

    const primerPago = new Date(hoy);
    primerPago.setDate(primerPago.getDate() + 1);

    document.querySelector(
        "#fechaDesembolsoPrestamo"
    ).value = fechaHoy;

    document.querySelector(
        "#fechaPrimerPagoPrestamo"
    ).value = convertirFechaInput(primerPago);
}

function convertirFechaInput(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function obtenerNombreCliente(cliente) {
    return [
        cliente.nombres,
        cliente.apellidoPaterno,
        cliente.apellidoMaterno
    ]
        .filter(Boolean)
        .join(" ");
}

function normalizarBusqueda(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function escaparTexto(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
