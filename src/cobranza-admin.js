import { apiFetch } from "./api.js";

export async function mostrarCobranzaAdministrador(
  usuario,
  volverAlInicio
) {
  document.querySelector("#app").innerHTML = `
    <main
      id="pantallaCobranzaAdmin"
      class="aplicacion-movil"
    >

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverCobranzaAdmin"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Cobranza</h1>
            <p>Seguimiento de cobradores</p>
          </div>

          <button
            type="button"
            id="btnActualizarCobranza"
            class="btn-actualizar"
          >
            Actualizar
          </button>
        </div>
      </header>

      <section class="contenido-cobranza-admin">

        <div class="selector-cobrador-admin">
          <label for="selectCobradorAdmin">
            Cobrador
          </label>

          <select id="selectCobradorAdmin">
            <option value="">
              Seleccionar cobrador
            </option>
          </select>
        </div>

        <div id="contenidoCobranzaAdmin">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando cobradores...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverCobranzaAdmin")
    .addEventListener("click", volverAlInicio);

  try {
    const cobradores = await apiFetch(
      "/cobradores/activos"
    );

    cargarSelectorCobradores(cobradores);

    const selector = document.querySelector(
      "#selectCobradorAdmin"
    );

    selector.addEventListener("change", () => {
      const idCobrador = Number(
        selector.value
      );

      if (idCobrador) {
        cargarDatosCobrador(idCobrador);
      }
    });

    document
      .querySelector("#btnActualizarCobranza")
      .addEventListener("click", () => {
        const idCobrador = Number(
          selector.value
        );

        if (idCobrador) {
          cargarDatosCobrador(idCobrador);
        }
      });

    if (cobradores.length === 1) {
      selector.value =
        cobradores[0].idCobrador;

      await cargarDatosCobrador(
        cobradores[0].idCobrador
      );
    } else {
      document.querySelector(
        "#contenidoCobranzaAdmin"
      ).innerHTML = `
        <div class="seleccionar-cobrador">
          <div>👤</div>
          <h2>Selecciona un cobrador</h2>
          <p>
            Elige a la persona que deseas revisar.
          </p>
        </div>
      `;
    }

    iniciarActualizacionAutomatica();

  } catch (error) {
    mostrarErrorAdmin(error.message);
  }
}

function cargarSelectorCobradores(
  cobradores
) {
  const selector = document.querySelector(
    "#selectCobradorAdmin"
  );

  selector.innerHTML = `
    <option value="">
      Seleccionar cobrador
    </option>

    ${cobradores
      .map((cobrador) => {
        const nombre = [
          cobrador.nombres,
          cobrador.apellidoPaterno,
          cobrador.apellidoMaterno
        ]
          .filter(Boolean)
          .join(" ");

        return `
          <option value="${cobrador.idCobrador}">
            ${escaparTexto(nombre)}
          </option>
        `;
      })
      .join("")}
  `;
}

async function cargarDatosCobrador(
  idCobrador
) {
  const contenido = document.querySelector(
    "#contenidoCobranzaAdmin"
  );

  if (!contenido) {
    return;
  }

  contenido.innerHTML = `
    <div class="estado-cargando">
      <div class="cargador"></div>
      <p>Actualizando cobranza...</p>
    </div>
  `;

  try {
    const [
      cobranzas,
      pagos,
      visitas
    ] = await Promise.all([
      apiFetch(
        `/cobranzas/cobrador/${idCobrador}/hoy`
      ),

      apiFetch(
        `/pagos/cobrador/${idCobrador}`
      ),

      apiFetch(
        `/visitas-cobranza/cobrador/${idCobrador}`
      )
    ]);

    renderizarCobranzaAdministrador(
      cobranzas,
      pagos,
      visitas
    );

  } catch (error) {
    mostrarErrorAdmin(error.message);
  }
}

function renderizarCobranzaAdministrador(
  cobranzas,
  pagos,
  visitas
) {
  const fechaHoy = obtenerFechaActual();

  const pagosHoy = pagos.filter(
    (pago) =>
      obtenerParteFecha(pago.fechaPago) ===
      fechaHoy
  );

  const visitasHoy = visitas.filter(
    (visita) =>
      obtenerParteFecha(
        visita.fechaVisita
      ) === fechaHoy
  );

  const totalPendiente = cobranzas.reduce(
    (total, cobranza) =>
      total + Number(
        cobranza.montoPendienteCuota || 0
      ),
    0
  );

  const totalCobradoHoy = pagosHoy.reduce(
    (total, pago) =>
      total + Number(pago.montoTotal || 0),
    0
  );

  document.querySelector(
    "#contenidoCobranzaAdmin"
  ).innerHTML = `
    <div class="ultima-actualizacion">
      Actualizado:
      ${new Date().toLocaleTimeString(
        "es-PE",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )}
    </div>

    <div class="resumen-admin-cobranza">

      <article>
        <span>Clientes pendientes</span>
        <strong>${cobranzas.length}</strong>
      </article>

      <article>
        <span>Por cobrar hoy</span>
        <strong>
          ${formatearDinero(totalPendiente)}
        </strong>
      </article>

      <article>
        <span>Cobrado hoy</span>
        <strong>
          ${formatearDinero(totalCobradoHoy)}
        </strong>
      </article>

      <article>
        <span>No pagaron</span>
        <strong>${visitasHoy.length}</strong>
      </article>

    </div>

    <div class="titulo-seccion">
      <h2>Actividad de hoy</h2>
      <p>Pagos y visitas registrados</p>
    </div>

    ${crearActividadHoy(
      pagosHoy,
      visitasHoy
    )}

    <div class="titulo-seccion">
      <h2>Clientes pendientes</h2>
      <p>Cuotas que deben cobrarse</p>
    </div>

    ${crearPendientesAdmin(cobranzas)}
  `;
}

function crearActividadHoy(
  pagos,
  visitas
) {
  const actividades = [
    ...pagos.map((pago) => ({
      tipo: "PAGO",
      fecha: pago.fechaPago,
      monto: pago.montoTotal,
      saldoNuevo: pago.saldoNuevo,
      cliente: obtenerNombreDesdePago(pago)
    })),

    ...visitas.map((visita) => ({
      tipo: "VISITA",
      fecha: visita.fechaVisita,
      motivo: visita.motivo,
      cliente: visita.nombreCliente
    }))
  ].sort(
    (actividadA, actividadB) =>
      new Date(actividadB.fecha) -
      new Date(actividadA.fecha)
  );

  if (actividades.length === 0) {
    return `
      <div class="actividad-vacia">
        Todavía no hay actividad registrada hoy.
      </div>
    `;
  }

  return `
    <div class="lista-actividad-admin">
      ${actividades
        .map((actividad) => {
          if (actividad.tipo === "PAGO") {
            return `
              <article class="actividad-admin pago">
                <div>S/</div>

                <section>
                  <strong>
                    ${escaparTexto(
                      actividad.cliente
                    )}
                  </strong>

                  <span>
                    Pago registrado ·
                    ${formatearHora(
                      actividad.fecha
                    )}
                  </span>
                </section>

                <b>
                  + ${formatearDinero(
                    actividad.monto
                  )}
                </b>
              </article>
            `;
          }

          return `
            <article class="actividad-admin visita">
              <div>!</div>

              <section>
                <strong>
                  ${escaparTexto(
                    actividad.cliente
                  )}
                </strong>

                <span>
                  No pagó:
                  ${escaparTexto(
                    formatearMotivo(
                      actividad.motivo
                    )
                  )}
                  · ${formatearHora(
                    actividad.fecha
                  )}
                </span>
              </section>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function crearPendientesAdmin(cobranzas) {
  if (cobranzas.length === 0) {
    return `
      <div class="actividad-vacia correcto">
        No hay clientes pendientes para hoy.
      </div>
    `;
  }

  return `
    <div class="lista-pendientes-admin">

      ${cobranzas
        .map((cobranza) => `
          <article class="pendiente-admin">

            <div>
              <span>
                ${escaparTexto(
                  cobranza.codigoCliente
                )}
              </span>

              <h3>
                ${escaparTexto(
                  cobranza.nombreCliente
                )}
              </h3>

              <p>
                ${escaparTexto(
                  cobranza.numeroContrato
                )}
                · ${escaparTexto(
                  cobranza.zona ||
                  "Sin zona"
                )}
              </p>
            </div>

            <section>
              <span>Cuota</span>

              <strong>
                ${formatearDinero(
                  cobranza.montoPendienteCuota
                )}
              </strong>
            </section>

          </article>
        `)
        .join("")}

    </div>
  `;
}

function iniciarActualizacionAutomatica() {
  const intervalo = setInterval(() => {
    const pantalla = document.querySelector(
      "#pantallaCobranzaAdmin"
    );

    if (!pantalla) {
      clearInterval(intervalo);
      return;
    }

    const selector = document.querySelector(
      "#selectCobradorAdmin"
    );

    const idCobrador = Number(
      selector?.value
    );

    if (idCobrador) {
      cargarDatosCobrador(idCobrador);
    }
  }, 30000);
}

function obtenerNombreDesdePago(pago) {
  const cliente =
    pago.venta?.cliente || {};

  const nombre = [
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno
  ]
    .filter(Boolean)
    .join(" ");

  return nombre || "Cliente";
}

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerParteFecha(fecha) {
  return String(fecha || "")
    .substring(0, 10);
}

function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString(
    "es-PE",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
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

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString(
    "es-PE",
    {
      style: "currency",
      currency: "PEN"
    }
  );
}

function mostrarErrorAdmin(mensaje) {
  const contenido = document.querySelector(
    "#contenidoCobranzaAdmin"
  );

  if (!contenido) {
    return;
  }

  contenido.innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se pudo cargar la cobranza</h2>
      <p>${escaparTexto(mensaje)}</p>
    </div>
  `;
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}