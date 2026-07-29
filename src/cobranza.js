import { apiFetch } from "./api.js";

import {
  mostrarFormularioPago
} from "./pago.js";

import {
  mostrarFormularioNoPago
} from "./no-pago.js";

export async function mostrarCobrosDeHoy(
  usuario,
  volverAlInicio
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverCobranza"
          class="btn-volver"
          aria-label="Volver"
        >
          ‹
        </button>

        <div>
          <h1>Cobros de hoy</h1>
          <p id="fechaCobranza"></p>
        </div>
      </header>

      <section class="contenido-cobranza">

        <div id="resumenCobranza" class="resumen-cobranza">
          <article>
            <span>Clientes</span>
            <strong>--</strong>
          </article>

          <article>
            <span>Por cobrar</span>
            <strong>--</strong>
          </article>
        </div>

        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarCobranza"
            placeholder="Buscar cliente, contrato o zona"
          >
        </div>

        <div id="listaCobranzas">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando cobros de hoy...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  const fechaActual = new Date();

  document.querySelector(
    "#fechaCobranza"
  ).textContent = fechaActual.toLocaleDateString(
    "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  );

  document
    .querySelector("#btnVolverCobranza")
    .addEventListener("click", volverAlInicio);

  if (!usuario.idCobrador) {
    mostrarError(
      "El usuario no está relacionado con un cobrador."
    );

    return;
  }

  try {
    const cobranzas = await apiFetch(
      `/cobranzas/cobrador/${usuario.idCobrador}/hoy`
    );

    renderizarResumen(cobranzas);
    renderizarCobranzas(cobranzas);
    activarBuscador();
    activarBotonesCobranza(
  cobranzas,
  usuario,
  () => mostrarCobrosDeHoy(
    usuario,
    volverAlInicio
  )
);

  } catch (error) {
    mostrarError(error.message);
  }
}

function renderizarResumen(cobranzas) {
  const totalPendiente = cobranzas.reduce(
    (total, cobranza) => {
      return total + Number(
        cobranza.montoPendienteCuota || 0
      );
    },
    0
  );

  document.querySelector(
    "#resumenCobranza"
  ).innerHTML = `
    <article>
      <span>Clientes</span>
      <strong>${cobranzas.length}</strong>
    </article>

    <article>
      <span>Por cobrar</span>
      <strong>${formatearDinero(totalPendiente)}</strong>
    </article>
  `;
}

function renderizarCobranzas(cobranzas) {
  const lista = document.querySelector(
    "#listaCobranzas"
  );

  if (cobranzas.length === 0) {
    lista.innerHTML = `
      <div class="cobranza-vacia">
        <div>✓</div>
        <h2>No hay cobros pendientes</h2>
        <p>
          Gregorio no tiene clientes pendientes
          para el día de hoy.
        </p>
      </div>
    `;

    return;
  }

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${cobranzas.length}
      ${cobranzas.length === 1 ? "cliente" : "clientes"}
    </div>

    <div class="lista-cobranzas">
      ${cobranzas
        .map(crearTarjetaCobranza)
        .join("")}
    </div>

    <p
      id="mensajeAccionCobranza"
      class="aviso-accion"
    ></p>
  `;
}

function crearTarjetaCobranza(cobranza) {
  const estado = cobranza.estadoCuota || "PENDIENTE";

  const claseEstado = estado.toLowerCase();

  const busqueda = [
    cobranza.nombreCliente,
    cobranza.numeroContrato,
    cobranza.codigoCliente,
    cobranza.zona
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const direccion =
    cobranza.direccion || "Dirección no registrada";

  const zona =
    cobranza.zona || "Zona no registrada";

  const celular =
    cobranza.celular || "";

  return `
    <article
      class="tarjeta-cobranza"
      data-busqueda="${escaparTexto(busqueda)}"
    >
      <div class="cobranza-encabezado">

        <div>
          <span class="codigo-cliente">
            ${escaparTexto(
              cobranza.codigoCliente || "SIN CÓDIGO"
            )}
          </span>

          <h2>
            ${escaparTexto(cobranza.nombreCliente)}
          </h2>
        </div>

        <span class="estado-cuota ${claseEstado}">
          ${estado}
        </span>

      </div>

      <div class="datos-cobranza">

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

      </div>

      <div class="informacion-cliente">
        <p>
          <b>Contrato:</b>
          ${escaparTexto(cobranza.numeroContrato)}
        </p>

        <p>
          <b>Cuota:</b>
          N.º ${cobranza.numeroCuota}
          · ${formatearFecha(
            cobranza.fechaVencimiento
          )}
        </p>

        <p>
          <b>Zona:</b>
          ${escaparTexto(zona)}
        </p>

        <p>
          <b>Dirección:</b>
          ${escaparTexto(direccion)}
        </p>

        ${
          cobranza.diasAtraso > 0
            ? `
              <p class="dias-atraso">
                ${cobranza.diasAtraso}
                ${
                  cobranza.diasAtraso === 1
                    ? "día de atraso"
                    : "días de atraso"
                }
              </p>
            `
            : ""
        }
      </div>

      <div class="acciones-cobranza">

        ${
          celular
            ? `
              <a
                href="tel:${escaparTexto(celular)}"
                class="btn-llamar"
              >
                Llamar
              </a>
            `
            : ""
        }

        <button
          type="button"
          class="btn-no-pago"
          data-no-pago="${cobranza.idCuota}"
        >
          No pagó
        </button>

        <button
          type="button"
          class="btn-cobrar-cliente"
          data-cobrar="${cobranza.idCuota}"
        >
          Cobrar
        </button>

      </div>
    </article>
  `;
}

function activarBuscador() {
  const buscador = document.querySelector(
    "#buscarCobranza"
  );

  buscador.addEventListener("input", () => {
    const texto = buscador.value
      .trim()
      .toLowerCase();

    document
      .querySelectorAll(".tarjeta-cobranza")
      .forEach((tarjeta) => {
        const coincide = tarjeta.dataset.busqueda
          .includes(texto);

        tarjeta.hidden = !coincide;
      });
  });
}

function activarBotonesCobranza(
  cobranzas,
  usuario,
  volverALista
) {
  document
    .querySelectorAll("[data-cobrar]")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        const idCuota = Number(
          boton.dataset.cobrar
        );

        const cobranza = cobranzas.find(
          (item) =>
            Number(item.idCuota) === idCuota
        );

        if (!cobranza) {
          return;
        }

        mostrarFormularioPago(
          cobranza,
          usuario,
          volverALista
        );
      });
    });

 document
  .querySelectorAll("[data-no-pago]")
  .forEach((boton) => {
    boton.addEventListener("click", () => {
      const idCuota = Number(
        boton.dataset.noPago
      );

      const cobranza = cobranzas.find(
        (item) =>
          Number(item.idCuota) === idCuota
      );

      if (!cobranza) {
        return;
      }

      mostrarFormularioNoPago(
        cobranza,
        usuario,
        volverALista
      );
    });
  });
}

function mostrarError(mensaje) {
  document.querySelector(
    "#listaCobranzas"
  ).innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se pudieron cargar los cobros</h2>
      <p>${escaparTexto(mensaje)}</p>
    </div>
  `;
}

function formatearDinero(valor) {
  const numero = Number(valor || 0);

  return numero.toLocaleString(
    "es-PE",
    {
      style: "currency",
      currency: "PEN"
    }
  );
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaLocal = new Date(
    `${fecha}T00:00:00`
  );

  return fechaLocal.toLocaleDateString(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
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