import { apiFetch } from "./api.js";

export function mostrarFormularioNoPago(
  cobranza,
  usuario,
  volverACobranza
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverNoPago"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>No pagó</h1>
          <p>Registrar visita al cliente</p>
        </div>
      </header>

      <section class="contenido-formulario">

        <article class="cliente-no-pago">

          <div class="avatar-no-pago">
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
              · Cuota N.º
              ${cobranza.numeroCuota}
            </p>
          </div>

        </article>

        <article class="saldo-no-pago">
          <span>Cuota pendiente</span>

          <strong>
            ${formatearDinero(
              cobranza.montoPendienteCuota
            )}
          </strong>

          <p>
            El saldo no será modificado.
          </p>
        </article>

        <form
          id="formNoPago"
          class="formulario-movil"
        >

          <div class="grupo-formulario">
            <h2>¿Por qué no pagó?</h2>

            <div class="opciones-no-pago">

              <label>
                <input
                  type="radio"
                  name="motivoNoPago"
                  value="NO_ESTABA"
                  required
                >

                <span class="icono-motivo">🏠</span>

                <div>
                  <strong>No estaba</strong>
                  <small>
                    No se encontró al cliente
                  </small>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="motivoNoPago"
                  value="SIN_DINERO"
                >

                <span class="icono-motivo">💸</span>

                <div>
                  <strong>Sin dinero</strong>
                  <small>
                    No pudo pagar hoy
                  </small>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="motivoNoPago"
                  value="PROMETIO_PAGAR"
                >

                <span class="icono-motivo">📅</span>

                <div>
                  <strong>Prometió pagar</strong>
                  <small>
                    Indicó una nueva fecha
                  </small>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="motivoNoPago"
                  value="DIRECCION_NO_ENCONTRADA"
                >

                <span class="icono-motivo">📍</span>

                <div>
                  <strong>
                    Dirección no encontrada
                  </strong>

                  <small>
                    No se encontró el domicilio
                  </small>
                </div>
              </label>

              <label>
                <input
                  type="radio"
                  name="motivoNoPago"
                  value="OTRO"
                >

                <span class="icono-motivo">✏️</span>

                <div>
                  <strong>Otro motivo</strong>
                  <small>
                    Escribir una explicación
                  </small>
                </div>
              </label>

            </div>
          </div>

          <div class="grupo-formulario">
            <h2>Información de la visita</h2>

            <label>
              Fecha y hora <b>*</b>

              <input
                type="datetime-local"
                id="noPagoFecha"
                required
              >
            </label>

            <div
              id="contenedorProximaFecha"
              class="campo-oculto"
            >
              <label>
                Nueva fecha prometida <b>*</b>

                <input
                  type="date"
                  id="noPagoProximaFecha"
                >
              </label>
            </div>

            <label>
              Observaciones

              <textarea
                id="noPagoObservaciones"
                rows="4"
                placeholder="Escribe lo que indicó el cliente"
              ></textarea>
            </label>
          </div>

          <label class="confirmacion-contrato">
            <input
              type="checkbox"
              id="noPagoConfirmado"
              required
            >

            <span>
              Confirmo que visité al cliente
              y no recibí ningún pago.
            </span>
          </label>

          <p
            id="mensajeNoPago"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnRegistrarNoPago"
            class="btn-registrar-no-pago"
          >
            Registrar visita
          </button>

        </form>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverNoPago")
    .addEventListener(
      "click",
      volverACobranza
    );

  document.querySelector(
    "#noPagoFecha"
  ).value = obtenerFechaHoraActual();

  activarFormularioNoPago(
    cobranza,
    usuario,
    volverACobranza
  );
}

function activarFormularioNoPago(
  cobranza,
  usuario,
  volverACobranza
) {
  const radios = document.querySelectorAll(
    'input[name="motivoNoPago"]'
  );

  const contenedorFecha =
    document.querySelector(
      "#contenedorProximaFecha"
    );

  const proximaFecha =
    document.querySelector(
      "#noPagoProximaFecha"
    );

  const observaciones =
    document.querySelector(
      "#noPagoObservaciones"
    );

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const prometioPagar =
        radio.value === "PROMETIO_PAGAR";

      const otroMotivo =
        radio.value === "OTRO";

      contenedorFecha.classList.toggle(
        "campo-oculto",
        !prometioPagar
      );

      proximaFecha.required = prometioPagar;
      observaciones.required = otroMotivo;

      if (!prometioPagar) {
        proximaFecha.value = "";
      }
    });
  });

  document
    .querySelector("#formNoPago")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await registrarNoPago(
        cobranza,
        usuario,
        volverACobranza
      );
    });
}

async function registrarNoPago(
  cobranza,
  usuario,
  volverACobranza
) {
  const mensaje = document.querySelector(
    "#mensajeNoPago"
  );

  const motivoSeleccionado =
    document.querySelector(
      'input[name="motivoNoPago"]:checked'
    );

  if (!motivoSeleccionado) {
    mostrarError(
      mensaje,
      "Selecciona el motivo."
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

  const motivo = motivoSeleccionado.value;

  const proximaFecha =
    document.querySelector(
      "#noPagoProximaFecha"
    ).value;

  const observaciones =
    document.querySelector(
      "#noPagoObservaciones"
    ).value.trim();

  if (
    motivo === "PROMETIO_PAGAR" &&
    !proximaFecha
  ) {
    mostrarError(
      mensaje,
      "Selecciona la nueva fecha prometida."
    );
    return;
  }

  if (
    motivo === "OTRO" &&
    !observaciones
  ) {
    mostrarError(
      mensaje,
      "Escribe una explicación."
    );
    return;
  }

  const solicitud = {
    idCuota: cobranza.idCuota,
    idCobrador: usuario.idCobrador,

    fechaVisita: document.querySelector(
      "#noPagoFecha"
    ).value,

    motivo,

    observaciones:
      observaciones || null,

    proximaFecha:
      proximaFecha || null
  };

  const boton = document.querySelector(
    "#btnRegistrarNoPago"
  );

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Registrando visita...";

  try {
    const visita = await apiFetch(
      "/visitas-cobranza/no-pago",
      {
        method: "POST",
        body: JSON.stringify(solicitud)
      }
    );

    mostrarVisitaRegistrada(
      visita,
      cobranza,
      volverACobranza
    );

  } catch (error) {
    mostrarError(
      mensaje,
      error.message
    );

    boton.disabled = false;
    boton.textContent = "Registrar visita";
  }
}

function mostrarVisitaRegistrada(
  visita,
  cobranza,
  volverACobranza
) {
  document.querySelector(
    ".contenido-formulario"
  ).innerHTML = `
    <div class="visita-registrada">

      <div class="icono-visita-registrada">
        ✓
      </div>

      <span>VISITA REGISTRADA</span>

      <h2>Cliente visitado</h2>

      <p>
        Se registró que
        ${escaparTexto(
          cobranza.nombreCliente
        )}
        no realizó un pago.
      </p>

      <strong>
        ${formatearMotivo(
          visita.motivo
        )}
      </strong>

      ${
        visita.proximaFecha
          ? `
            <div class="nueva-fecha-visita">
              <span>Nueva fecha prometida</span>
              <b>
                ${formatearFecha(
                  visita.proximaFecha
                )}
              </b>
            </div>
          `
          : ""
      }

      <button
        type="button"
        id="btnVolverDespuesNoPago"
        class="btn-registrar-no-pago"
      >
        Volver a cobros de hoy
      </button>

    </div>
  `;

  document
    .querySelector(
      "#btnVolverDespuesNoPago"
    )
    .addEventListener(
      "click",
      volverACobranza
    );
}

function formatearMotivo(motivo) {
  const motivos = {
    NO_ESTABA: "No estaba",
    SIN_DINERO: "Sin dinero",
    PROMETIO_PAGAR: "Prometió pagar",
    DIRECCION_NO_ENCONTRADA:
      "Dirección no encontrada",
    OTRO: "Otro motivo"
  };

  return motivos[motivo] || motivo;
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

function formatearFecha(fecha) {
  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString("es-PE");
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