import { apiFetch } from "./api.js";

export function mostrarRegistrarPagoPrestamo(
  usuario,
  prestamo,
  volverAlDetalle
) {
  const cliente = prestamo.cliente || {};
  const saldoPendiente = Number(
    prestamo.saldoPendiente || 0
  );

  const cuotaSugerida = Math.min(
    Number(prestamo.montoCuota || 0),
    saldoPendiente
  );

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverRegistrarPago"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Registrar pago</h1>
          <p>
            ${escaparTexto(
              prestamo.numeroPrestamo || "Préstamo"
            )}
          </p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <article class="tarjeta-cobranza">
          <div class="cobranza-encabezado">
            <div>
              <span class="codigo-cliente">
                ${escaparTexto(
                  cliente.codigoCliente || "CLIENTE"
                )}
              </span>

              <h2>
                ${escaparTexto(
                  obtenerNombreCliente(cliente)
                )}
              </h2>
            </div>

            <span class="estado-cuota pendiente">
              ACTIVO
            </span>
          </div>

          <div class="datos-cobranza">
            <div>
              <span>Cuota habitual</span>
              <strong>
                ${formatearDinero(
                  prestamo.montoCuota
                )}
              </strong>
            </div>

            <div>
              <span>Saldo pendiente</span>
              <strong id="saldoActualPago">
                ${formatearDinero(saldoPendiente)}
              </strong>
            </div>
          </div>
        </article>

        <form
          id="formRegistrarPagoPrestamo"
          class="formulario-movil"
          style="margin-top: 15px;"
        >
          <section class="grupo-formulario">
            <h2>Datos del pago</h2>

            <label>
              Monto recibido <b>*</b>

              <input
                type="number"
                id="montoPagoPrestamo"
                min="0.01"
                max="${saldoPendiente}"
                step="0.01"
                value="${cuotaSugerida.toFixed(2)}"
                required
              >
            </label>

            <label>
              Fecha del pago <b>*</b>

              <input
                type="date"
                id="fechaPagoPrestamo"
                required
              >
            </label>

            <label>
              Observaciones

              <textarea
                id="observacionesPagoPrestamo"
                rows="4"
                placeholder="Información adicional del pago"
              ></textarea>
            </label>
          </section>

          <div class="datos-cobranza">
            <div>
              <span>Pago ingresado</span>
              <strong id="resumenMontoPago">
                ${formatearDinero(cuotaSugerida)}
              </strong>
            </div>

            <div>
              <span>Nuevo saldo</span>
              <strong id="resumenNuevoSaldo">
                ${formatearDinero(
                  saldoPendiente - cuotaSugerida
                )}
              </strong>
            </div>
          </div>

          <button
            type="submit"
            id="btnGuardarPagoPrestamo"
            class="btn-guardar-formulario"
          >
            Confirmar pago
          </button>

          <p
            id="mensajePagoPrestamo"
            class="mensaje-formulario"
          ></p>
        </form>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverRegistrarPago")
    .addEventListener("click", volverAlDetalle);

  colocarFechaActual();
  activarCalculoNuevoSaldo(saldoPendiente);
  activarFormularioPago(
    prestamo,
    volverAlDetalle
  );
}

function activarCalculoNuevoSaldo(
  saldoPendiente
) {
  const campoMonto = document.querySelector(
    "#montoPagoPrestamo"
  );

  const actualizarResumen = () => {
    const monto = Number(campoMonto.value || 0);

    const nuevoSaldo = Math.max(
      saldoPendiente - monto,
      0
    );

    document.querySelector(
      "#resumenMontoPago"
    ).textContent = formatearDinero(monto);

    document.querySelector(
      "#resumenNuevoSaldo"
    ).textContent = formatearDinero(nuevoSaldo);
  };

  campoMonto.addEventListener(
    "input",
    actualizarResumen
  );
}

function activarFormularioPago(
  prestamo,
  volverAlDetalle
) {
  document
    .querySelector("#formRegistrarPagoPrestamo")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const formulario = evento.currentTarget;

      const botonGuardar = formulario.querySelector(
        'button[type="submit"]'
      );

      const mensaje = document.querySelector(
        "#mensajePagoPrestamo"
      );

      const montoPago = Number(
        document.querySelector(
          "#montoPagoPrestamo"
        ).value
      );

      const datosPago = {
        montoPago,
        fechaPago: document.querySelector(
          "#fechaPagoPrestamo"
        ).value,
        observaciones:
          document
            .querySelector(
              "#observacionesPagoPrestamo"
            )
            .value
            .trim() || null
      };

      try {
        botonGuardar.disabled = true;
        botonGuardar.textContent =
          "Registrando pago...";

        mensaje.classList.remove("error");
        mensaje.textContent = "";

        const pagoGuardado = await apiFetch(
          `/prestamos/${prestamo.idPrestamo}/pagos`,
          {
            method: "POST",
            body: JSON.stringify(datosPago)
          }
        );

        prestamo.saldoPendiente =
          pagoGuardado.saldoPosterior;

        if (
          Number(pagoGuardado.saldoPosterior) === 0
        ) {
          prestamo.estado = "FINALIZADO";
        }

        mostrarPagoExitoso(
          pagoGuardado,
          volverAlDetalle
        );
      } catch (error) {
        mensaje.classList.add("error");
        mensaje.textContent = error.message;

        botonGuardar.disabled = false;
        botonGuardar.textContent =
          "Confirmar pago";
      }
    });
}

function mostrarPagoExitoso(
  pago,
  volverAlDetalle
) {
  document.querySelector(
    ".contenido-cobranza"
  ).innerHTML = `
    <div class="registro-exitoso">
      <div>✓</div>

      <h2>Pago registrado</h2>

      <p>
        El pago fue aplicado correctamente al préstamo.
      </p>

      <strong>
        ${formatearDinero(pago.montoPago)}
      </strong>

      <div class="datos-cobranza">
        <div>
          <span>Saldo anterior</span>
          <strong>
            ${formatearDinero(pago.saldoAnterior)}
          </strong>
        </div>

        <div>
          <span>Nuevo saldo</span>
          <strong>
            ${formatearDinero(pago.saldoPosterior)}
          </strong>
        </div>
      </div>

      <button
        type="button"
        id="btnVolverPrestamoActualizado"
        class="btn-guardar-formulario"
        style="margin-top: 20px;"
      >
        Volver al préstamo
      </button>
    </div>
  `;

  document
    .querySelector(
      "#btnVolverPrestamoActualizado"
    )
    .addEventListener(
      "click",
      volverAlDetalle
    );
}

function colocarFechaActual() {
  const hoy = new Date();

  const anio = hoy.getFullYear();

  const mes = String(
    hoy.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoy.getDate()
  ).padStart(2, "0");

  document.querySelector(
    "#fechaPagoPrestamo"
  ).value = `${anio}-${mes}-${dia}`;
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

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}