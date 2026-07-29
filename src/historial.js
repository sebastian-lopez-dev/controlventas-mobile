import { apiFetch } from "./api.js";

export async function mostrarHistorial(
  usuario,
  volverAlInicio
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverHistorial"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Mi historial</h1>
          <p>Pagos y visitas realizadas</p>
        </div>
      </header>

      <section class="contenido-historial">

        <div id="resumenHistorial" class="resumen-historial">
          <article>
            <span>Total cobrado</span>
            <strong>--</strong>
          </article>

          <article>
            <span>Visitas sin pago</span>
            <strong>--</strong>
          </article>
        </div>

        <div class="filtros-historial">

          <button
            type="button"
            class="filtro-historial activo"
            data-filtro-historial="TODOS"
          >
            Todos
          </button>

          <button
            type="button"
            class="filtro-historial"
            data-filtro-historial="PAGO"
          >
            Pagos
          </button>

          <button
            type="button"
            class="filtro-historial"
            data-filtro-historial="VISITA"
          >
            No pagó
          </button>

        </div>

        <div id="listaHistorial">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando historial...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverHistorial")
    .addEventListener("click", volverAlInicio);

  if (!usuario.idCobrador) {
    mostrarErrorHistorial(
      "El usuario no está relacionado con un cobrador."
    );

    return;
  }

  try {
    const [
      pagos,
      visitas
    ] = await Promise.all([
      apiFetch(
        `/pagos/cobrador/${usuario.idCobrador}`
      ),

      apiFetch(
        `/visitas-cobranza/cobrador/${usuario.idCobrador}`
      )
    ]);

    const movimientos = crearMovimientos(
      pagos,
      visitas
    );

    renderizarResumen(pagos, visitas);
    renderizarHistorial(movimientos);
    activarFiltrosHistorial();

  } catch (error) {
    mostrarErrorHistorial(error.message);
  }
}

function crearMovimientos(pagos, visitas) {
  const movimientosPagos = pagos.map(
    (pago) => {
      const venta = pago.venta || {};
      const cliente = venta.cliente || {};

      return {
        tipo: "PAGO",
        fecha: pago.fechaPago,
        id: pago.idPago,
        codigo: pago.codigoPago,
        monto: pago.montoTotal,
        metodo: pago.metodoPago,
        saldoAnterior: pago.saldoAnterior,
        saldoNuevo: pago.saldoNuevo,
        numeroContrato:
          venta.numeroContrato ||
          "Sin contrato",
        nombreCliente:
          obtenerNombreCliente(cliente)
      };
    }
  );

  const movimientosVisitas = visitas.map(
    (visita) => ({
      tipo: "VISITA",
      fecha: visita.fechaVisita,
      id: visita.idVisita,
      motivo: visita.motivo,
      observaciones: visita.observaciones,
      proximaFecha: visita.proximaFecha,
      numeroContrato:
        visita.numeroContrato,
      nombreCliente:
        visita.nombreCliente
    })
  );

  return [
    ...movimientosPagos,
    ...movimientosVisitas
  ].sort((movimientoA, movimientoB) => {
    return new Date(movimientoB.fecha) -
      new Date(movimientoA.fecha);
  });
}

function renderizarResumen(pagos, visitas) {
  const totalCobrado = pagos.reduce(
    (total, pago) =>
      total + Number(pago.montoTotal || 0),
    0
  );

  document.querySelector(
    "#resumenHistorial"
  ).innerHTML = `
    <article>
      <span>Total cobrado</span>
      <strong>
        ${formatearDinero(totalCobrado)}
      </strong>
    </article>

    <article>
      <span>Visitas sin pago</span>
      <strong>${visitas.length}</strong>
    </article>
  `;
}

function renderizarHistorial(movimientos) {
  const lista = document.querySelector(
    "#listaHistorial"
  );

  if (movimientos.length === 0) {
    lista.innerHTML = `
      <div class="historial-vacio">
        <div>🕘</div>
        <h2>No hay movimientos</h2>
        <p>
          Los pagos y visitas aparecerán aquí.
        </p>
      </div>
    `;

    return;
  }

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${movimientos.length}
      ${
        movimientos.length === 1
          ? "movimiento"
          : "movimientos"
      }
    </div>

    <div class="lista-historial">
      ${movimientos
        .map(crearTarjetaMovimiento)
        .join("")}
    </div>
  `;
}

function crearTarjetaMovimiento(movimiento) {
  if (movimiento.tipo === "PAGO") {
    return crearTarjetaPago(movimiento);
  }

  return crearTarjetaVisita(movimiento);
}

function crearTarjetaPago(movimiento) {
  return `
    <article
      class="tarjeta-historial pago"
      data-tipo-historial="PAGO"
    >
      <div class="icono-historial pago">
        S/
      </div>

      <div class="datos-historial">
        <span>PAGO REGISTRADO</span>

        <h2>
          ${escaparTexto(
            movimiento.nombreCliente
          )}
        </h2>

        <p>
          ${escaparTexto(
            movimiento.numeroContrato
          )}
          · ${formatearFechaHora(
            movimiento.fecha
          )}
        </p>

        <small>
          ${escaparTexto(
            movimiento.metodo
          )}
          · Nuevo saldo:
          ${formatearDinero(
            movimiento.saldoNuevo
          )}
        </small>
      </div>

      <strong class="monto-historial">
        + ${formatearDinero(
          movimiento.monto
        )}
      </strong>
    </article>
  `;
}

function crearTarjetaVisita(movimiento) {
  return `
    <article
      class="tarjeta-historial visita"
      data-tipo-historial="VISITA"
    >
      <div class="icono-historial visita">
        !
      </div>

      <div class="datos-historial">
        <span>VISITA SIN PAGO</span>

        <h2>
          ${escaparTexto(
            movimiento.nombreCliente
          )}
        </h2>

        <p>
          ${escaparTexto(
            movimiento.numeroContrato
          )}
          · ${formatearFechaHora(
            movimiento.fecha
          )}
        </p>

        <small>
          ${escaparTexto(
            formatearMotivo(
              movimiento.motivo
            )
          )}
          ${
            movimiento.proximaFecha
              ? `
                · Nueva fecha:
                ${formatearFecha(
                  movimiento.proximaFecha
                )}
              `
              : ""
          }
        </small>
      </div>
    </article>
  `;
}

function activarFiltrosHistorial() {
  document
    .querySelectorAll(
      "[data-filtro-historial]"
    )
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        document
          .querySelectorAll(
            "[data-filtro-historial]"
          )
          .forEach((item) =>
            item.classList.remove("activo")
          );

        boton.classList.add("activo");

        const filtro =
          boton.dataset.filtroHistorial;

        document
          .querySelectorAll(
            "[data-tipo-historial]"
          )
          .forEach((tarjeta) => {
            tarjeta.hidden = !(
              filtro === "TODOS" ||
              tarjeta.dataset.tipoHistorial ===
                filtro
            );
          });
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

function formatearFechaHora(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Date(fecha).toLocaleString(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "";
  }

  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString("es-PE");
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

function mostrarErrorHistorial(mensaje) {
  document.querySelector(
    "#listaHistorial"
  ).innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se pudo cargar el historial</h2>
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