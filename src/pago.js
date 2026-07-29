import { apiFetch } from "./api.js";

export function mostrarFormularioPago(
  cobranza,
  usuario,
  volverACobranza
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverPago"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Registrar pago</h1>
          <p>Cuota del cliente</p>
        </div>
      </header>

      <section class="contenido-formulario">

        <article class="cliente-pago">

          <div class="avatar-pago">
            ${obtenerIniciales(
              cobranza.nombreCliente
            )}
          </div>

          <div>
            <span>
              ${escaparTexto(
                cobranza.codigoCliente
              )}
            </span>

            <h2>
              ${escaparTexto(
                cobranza.nombreCliente
              )}
            </h2>

            <p>
              ${escaparTexto(
                cobranza.numeroContrato
              )}
            </p>
          </div>

        </article>

        <article class="resumen-pago">

          <div>
            <span>Cuota pendiente</span>
            <strong>
              ${formatearDinero(
                cobranza.montoPendienteCuota
              )}
            </strong>
          </div>

          <div>
            <span>Saldo del contrato</span>
            <strong>
              ${formatearDinero(
                cobranza.saldoContrato
              )}
            </strong>
          </div>

        </article>

        <form
          id="formRegistrarPago"
          class="formulario-movil"
        >

          <div class="grupo-formulario">
            <h2>Datos del pago</h2>

            <label>
              Monto recibido <b>*</b>

              <div class="campo-dinero">
                <span>S/</span>

                <input
                  type="number"
                  id="pagoMonto"
                  min="0.01"
                  max="${cobranza.saldoContrato}"
                  step="0.01"
                  value="${Number(
                    cobranza.montoPendienteCuota
                  ).toFixed(2)}"
                  required
                >
              </div>
            </label>

            <label>
              Método de pago <b>*</b>

              <select id="pagoMetodo" required>
                <option value="EFECTIVO">
                  Efectivo
                </option>

                <option value="YAPE">
                  Yape
                </option>

                <option value="PLIN">
                  Plin
                </option>

                <option value="TRANSFERENCIA">
                  Transferencia
                </option>
              </select>
            </label>

            <div
              id="contenedorNumeroOperacion"
              class="campo-oculto"
            >
              <label>
                Número de operación <b>*</b>

                <input
                  type="text"
                  id="pagoNumeroOperacion"
                  placeholder="Código o número de operación"
                >
              </label>
            </div>

            <label>
              Fecha y hora <b>*</b>

              <input
                type="datetime-local"
                id="pagoFecha"
                required
              >
            </label>

            <label>
              Observaciones

              <textarea
                id="pagoObservaciones"
                rows="3"
                placeholder="Información adicional del pago"
              ></textarea>
            </label>
          </div>

          <article class="calculo-nuevo-saldo">

            <div>
              <span>Saldo anterior</span>
              <strong>
                ${formatearDinero(
                  cobranza.saldoContrato
                )}
              </strong>
            </div>

            <span class="signo-calculo">−</span>

            <div>
              <span>Pago</span>
              <strong id="resumenMontoPago">
                ${formatearDinero(
                  cobranza.montoPendienteCuota
                )}
              </strong>
            </div>

            <span class="signo-calculo">=</span>

            <div class="nuevo-saldo">
              <span>Nuevo saldo</span>
              <strong id="resumenNuevoSaldo">
                ${formatearDinero(
                  Number(cobranza.saldoContrato) -
                  Number(
                    cobranza.montoPendienteCuota
                  )
                )}
              </strong>
            </div>

          </article>

          <label class="confirmacion-contrato">
            <input
              type="checkbox"
              id="pagoConfirmado"
              required
            >

            <span>
              Confirmo que recibí este dinero
              del cliente.
            </span>
          </label>

          <p
            id="mensajePago"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnRegistrarPago"
            class="btn-guardar-pago"
          >
            Registrar pago
          </button>

        </form>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverPago")
    .addEventListener(
      "click",
      volverACobranza
    );

  document.querySelector(
    "#pagoFecha"
  ).value = obtenerFechaHoraActual();

  activarFormularioPago(
    cobranza,
    usuario,
    volverACobranza
  );
}

function activarFormularioPago(
  cobranza,
  usuario,
  volverACobranza
) {
  const monto = document.querySelector(
    "#pagoMonto"
  );

  const metodo = document.querySelector(
    "#pagoMetodo"
  );

  const contenedorOperacion =
    document.querySelector(
      "#contenedorNumeroOperacion"
    );

  const numeroOperacion =
    document.querySelector(
      "#pagoNumeroOperacion"
    );

  function actualizarNuevoSaldo() {
    const montoIngresado = Number(
      monto.value || 0
    );

    const nuevoSaldo = Math.max(
      Number(cobranza.saldoContrato) -
      montoIngresado,
      0
    );

    document.querySelector(
      "#resumenMontoPago"
    ).textContent = formatearDinero(
      montoIngresado
    );

    document.querySelector(
      "#resumenNuevoSaldo"
    ).textContent = formatearDinero(
      nuevoSaldo
    );
  }

  function actualizarMetodoPago() {
    const requiereOperacion =
      metodo.value !== "EFECTIVO";

    contenedorOperacion.classList.toggle(
      "campo-oculto",
      !requiereOperacion
    );

    numeroOperacion.required =
      requiereOperacion;

    if (!requiereOperacion) {
      numeroOperacion.value = "";
    }
  }

  monto.addEventListener(
    "input",
    actualizarNuevoSaldo
  );

  metodo.addEventListener(
    "change",
    actualizarMetodoPago
  );

  actualizarNuevoSaldo();
  actualizarMetodoPago();

  document
    .querySelector("#formRegistrarPago")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await registrarPago(
        cobranza,
        usuario,
        volverACobranza
      );
    });
}

async function registrarPago(
  cobranza,
  usuario,
  volverACobranza
) {
  const mensaje = document.querySelector(
    "#mensajePago"
  );

  const monto = Number(
    document.querySelector(
      "#pagoMonto"
    ).value
  );

  const saldoContrato = Number(
    cobranza.saldoContrato
  );

  if (monto <= 0) {
    mostrarError(
      mensaje,
      "El monto debe ser mayor que cero."
    );
    return;
  }

  if (monto > saldoContrato) {
    mostrarError(
      mensaje,
      `El pago no puede superar el saldo de ` +
      `${formatearDinero(saldoContrato)}.`
    );
    return;
  }

  if (!usuario.idCobrador) {
    mostrarError(
      mensaje,
      "El usuario no está relacionado con un cobrador."
    );
    return;
  }

  const metodoPago = document.querySelector(
    "#pagoMetodo"
  ).value;

  const numeroOperacion =
    document.querySelector(
      "#pagoNumeroOperacion"
    ).value.trim();

  if (
    metodoPago !== "EFECTIVO" &&
    !numeroOperacion
  ) {
    mostrarError(
      mensaje,
      "Ingresa el número de operación."
    );
    return;
  }

  const solicitud = {
    idVenta: cobranza.idVenta,
    idCobrador: usuario.idCobrador,
    monto,
    metodoPago,

    fechaPago: document.querySelector(
      "#pagoFecha"
    ).value,

    numeroOperacion:
      numeroOperacion || null,

    observaciones:
      obtenerValorONull(
        "#pagoObservaciones"
      )
  };

  const boton = document.querySelector(
    "#btnRegistrarPago"
  );

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Registrando pago...";

  try {
    const pago = await apiFetch(
      "/pagos",
      {
        method: "POST",
        body: JSON.stringify(solicitud)
      }
    );

    mostrarPagoRegistrado(
      pago,
      cobranza,
      volverACobranza
    );

  } catch (error) {
    mostrarError(
      mensaje,
      error.message
    );

    boton.disabled = false;
    boton.textContent = "Registrar pago";
  }
}

function mostrarPagoRegistrado(
  pago,
  cobranza,
  volverACobranza
) {
  document.querySelector(
    ".contenido-formulario"
  ).innerHTML = `
    <div class="pago-registrado">

      <div class="icono-pago-registrado">
        ✓
      </div>

      <span>PAGO REGISTRADO</span>

      <h2>
        ${formatearDinero(
          pago.montoTotal
        )}
      </h2>

      <p>
        Pago de
        ${escaparTexto(
          cobranza.nombreCliente
        )}
        registrado correctamente.
      </p>

      <strong>
        ${escaparTexto(
          pago.codigoPago || "PAGO GUARDADO"
        )}
      </strong>

      <div class="detalle-pago-registrado">

        <div>
          <span>Saldo anterior</span>
          <b>
            ${formatearDinero(
              pago.saldoAnterior
            )}
          </b>
        </div>

        <div>
          <span>Nuevo saldo</span>
          <b>
            ${formatearDinero(
              pago.saldoNuevo
            )}
          </b>
        </div>

        <div>
          <span>Método</span>
          <b>
            ${escaparTexto(
              pago.metodoPago
            )}
          </b>
        </div>

      </div>

      <button
        type="button"
        id="btnVolverCobros"
        class="btn-guardar-pago"
      >
        Volver a cobros de hoy
      </button>

    </div>
  `;

  document
    .querySelector("#btnVolverCobros")
    .addEventListener(
      "click",
      volverACobranza
    );
}

function obtenerFechaHoraActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  const hora = String(
    fecha.getHours()
  ).padStart(2, "0");

  const minutos = String(
    fecha.getMinutes()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}T${hora}:${minutos}`;
}

function obtenerIniciales(nombreCompleto) {
  return String(nombreCompleto || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0))
    .join("")
    .toUpperCase();
}

function mostrarError(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.classList.add("error");
}

function obtenerValorONull(selector) {
  const valor = document
    .querySelector(selector)
    .value
    .trim();

  return valor || null;
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