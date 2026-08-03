import { apiFetch } from "./api.js";

export async function mostrarReportes(
  usuario,
  volverAlInicio
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverReportes"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Reportes</h1>
          <p>Resumen de ventas a crédito</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div id="contenidoReportes">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando reporte...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverReportes")
    .addEventListener("click", volverAlInicio);

  try {
    const [
      ventas,
      pagos,
      productos,
      salidas
    ] = await Promise.all([
      apiFetch("/ventas"),
      apiFetch("/pagos"),
      apiFetch("/productos/activos"),
      apiFetch("/salidas")
    ]);

    renderizarReporte(
      ventas,
      pagos,
      productos,
      salidas
    );
  } catch (error) {
    document.querySelector(
      "#contenidoReportes"
    ).innerHTML = `
      <div class="error-cobranza">
        <div>!</div>

        <h2>No se pudo cargar el reporte</h2>

        <p>
          ${escaparTexto(error.message)}
        </p>
      </div>
    `;
  }
}

function renderizarReporte(
  ventas,
  pagos,
  productos,
  salidas
) {
  const ventasValidas = ventas.filter(
    (venta) => !esVentaAnulada(venta)
  );

  const totalVendido = ventasValidas.reduce(
    (total, venta) =>
      total + obtenerTotalVenta(venta),
    0
  );

  const saldoPendiente = ventasValidas.reduce(
    (total, venta) =>
      total + obtenerSaldoVenta(venta),
    0
  );

  const totalCobrado = Math.max(
    totalVendido - saldoPendiente,
    0
  );

  const ventasActivas = ventasValidas.filter(
    esVentaActiva
  );

  const ventasPagadas = ventasValidas.filter(
    (venta) =>
      obtenerTotalVenta(venta) > 0 &&
      obtenerSaldoVenta(venta) <= 0
  );

  const clientesConContrato = new Set(
    ventasValidas
      .map((venta) =>
        venta.cliente?.idCliente ??
        venta.cliente?.dni
      )
      .filter(Boolean)
  ).size;

  const fechaActual = obtenerFechaActual();

  const cobradoHoy = pagos
    .filter(
      (pago) =>
        obtenerParteFecha(pago.fechaPago) ===
        fechaActual
    )
    .reduce(
      (total, pago) =>
        total + obtenerMontoPago(pago),
      0
    );

  const pagosRegistrados = pagos.reduce(
    (total, pago) =>
      total + obtenerMontoPago(pago),
    0
  );

  const stockAlmacen = productos.reduce(
    (total, producto) =>
      total +
      Number(producto.stockAlmacen || 0),
    0
  );

  const productosStockBajo = productos.filter(
    (producto) => {
      const stock = Number(
        producto.stockAlmacen || 0
      );

      const minimo = Number(
        producto.stockMinimo || 0
      );

      return stock <= minimo;
    }
  ).length;

  const salidasAbiertas = salidas.filter(
    (salida) =>
      String(salida.estado).toUpperCase() ===
      "ABIERTA"
  ).length;

  const porcentajeCobrado =
    totalVendido > 0
      ? (totalCobrado / totalVendido) * 100
      : 0;

  const ventasRecientes = [...ventasValidas]
    .sort((ventaA, ventaB) => {
      const idA = Number(ventaA.idVenta || 0);
      const idB = Number(ventaB.idVenta || 0);

      return idB - idA;
    })
    .slice(0, 5);

  document.querySelector(
    "#contenidoReportes"
  ).innerHTML = `
    <div
      class="titulo-seccion"
      style="margin-top: 0;"
    >
      <h2>Resumen general</h2>

      <p>
        Estado actual del negocio
      </p>
    </div>

    <div class="resumen-cobranza">
      <article>
        <span>Total vendido</span>

        <strong>
          ${formatearDinero(totalVendido)}
        </strong>
      </article>

      <article>
        <span>Total cobrado</span>

        <strong>
          ${formatearDinero(totalCobrado)}
        </strong>
      </article>
    </div>

    <div
      class="resumen-cobranza"
      style="margin-top: 11px;"
    >
      <article>
        <span>Saldo pendiente</span>

        <strong>
          ${formatearDinero(saldoPendiente)}
        </strong>
      </article>

      <article>
        <span>Cobrado hoy</span>

        <strong>
          ${formatearDinero(cobradoHoy)}
        </strong>
      </article>
    </div>

    <div class="titulo-seccion">
      <h2>Contratos</h2>

      <p>
        Ventas activas y finalizadas
      </p>
    </div>

    <div class="resumen-cobranza">
      <article>
        <span>Contratos activos</span>

        <strong>
          ${ventasActivas.length}
        </strong>
      </article>

      <article>
        <span>Contratos pagados</span>

        <strong>
          ${ventasPagadas.length}
        </strong>
      </article>
    </div>

    <article
      class="tarjeta-cobranza"
      style="margin-top: 12px;"
    >
      <div
        class="informacion-cliente"
        style="
          margin-top: 0;
          padding-top: 0;
          border: 0;
        "
      >
        <p>
          <b>Contratos registrados:</b>
          ${ventasValidas.length}
        </p>

        <p>
          <b>Clientes con contrato:</b>
          ${clientesConContrato}
        </p>

        <p>
          <b>Pagos registrados:</b>
          ${pagos.length}
        </p>

        <p>
          <b>Dinero registrado en pagos:</b>
          ${formatearDinero(pagosRegistrados)}
        </p>

        <p>
          <b>Porcentaje cobrado:</b>
          ${porcentajeCobrado.toFixed(1)}%
        </p>
      </div>
    </article>

    <div class="titulo-seccion">
      <h2>Inventario y salidas</h2>

      <p>
        Estado de la mercadería
      </p>
    </div>

    <div class="resumen-cobranza">
      <article>
        <span>Stock en almacén</span>

        <strong>
          ${stockAlmacen}
        </strong>
      </article>

      <article>
        <span>Salidas abiertas</span>

        <strong>
          ${salidasAbiertas}
        </strong>
      </article>
    </div>

    <article
      class="tarjeta-cobranza"
      style="margin-top: 12px;"
    >
      <div
        class="informacion-cliente"
        style="
          margin-top: 0;
          padding-top: 0;
          border: 0;
        "
      >
        <p>
          <b>Productos activos:</b>
          ${productos.length}
        </p>

        <p>
          <b>Productos con stock bajo:</b>
          ${productosStockBajo}
        </p>

        <p>
          <b>Salidas registradas:</b>
          ${salidas.length}
        </p>
      </div>
    </article>

    <div class="titulo-seccion">
      <h2>Contratos recientes</h2>

      <p>
        Últimas ventas registradas
      </p>
    </div>

    ${crearContratosRecientes(ventasRecientes)}
  `;
}

function crearContratosRecientes(ventas) {
  if (ventas.length === 0) {
    return `
      <div class="cobranza-vacia">
        <div>📊</div>

        <h2>No hay información</h2>

        <p>
          Los contratos aparecerán aquí
          cuando registres ventas.
        </p>
      </div>
    `;
  }

  return `
    <div class="lista-cobranzas">
      ${ventas
        .map((venta) => {
          const cliente = venta.cliente || {};

          const saldo =
            obtenerSaldoVenta(venta);

          const total =
            obtenerTotalVenta(venta);

          const estado =
            obtenerEstadoVenta(venta);

          return `
            <article class="tarjeta-cobranza">
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    ${escaparTexto(
                      venta.numeroContrato ||
                      "SIN NÚMERO"
                    )}
                  </span>

                  <h2>
                    ${escaparTexto(
                      obtenerNombreCliente(cliente)
                    )}
                  </h2>
                </div>

                <span
                  class="estado-cuota ${obtenerClaseEstado(
                    estado,
                    saldo
                  )}"
                >
                  ${escaparTexto(
                    formatearEstado(estado, saldo)
                  )}
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Total venta</span>

                  <strong>
                    ${formatearDinero(total)}
                  </strong>
                </div>

                <div>
                  <span>Saldo</span>

                  <strong>
                    ${formatearDinero(saldo)}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Fecha:</b>
                  ${formatearFecha(
                    venta.fechaVenta
                  )}
                </p>

                <p>
                  <b>Modalidad:</b>
                  ${escaparTexto(
                    venta.modalidadPago ||
                    "No registrada"
                  )}
                </p>

                <p>
                  <b>Cobrador:</b>
                  ${escaparTexto(
                    obtenerNombreCobrador(
                      venta.cobrador
                    )
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

function esVentaActiva(venta) {
  const estado = obtenerEstadoVenta(venta);

  const terminada = [
    "PAGADA",
    "FINALIZADA",
    "ANULADA",
    "CANCELADA"
  ].includes(estado);

  return (
    !terminada &&
    obtenerSaldoVenta(venta) > 0
  );
}

function esVentaAnulada(venta) {
  return [
    "ANULADA",
    "CANCELADA"
  ].includes(obtenerEstadoVenta(venta));
}

function obtenerEstadoVenta(venta) {
  return String(
    venta.estado || "ACTIVA"
  ).toUpperCase();
}

function obtenerTotalVenta(venta) {
  const totalDirecto =
    venta.totalVenta ??
    venta.total ??
    venta.montoTotal;

  if (
    totalDirecto !== undefined &&
    totalDirecto !== null
  ) {
    return Number(totalDirecto || 0);
  }

  return (venta.detalles || []).reduce(
    (total, detalle) => {
      const cantidad = Number(
        detalle.cantidad || 0
      );

      const precio = Number(
        detalle.precioUnitario || 0
      );

      return total + cantidad * precio;
    },
    0
  );
}

function obtenerSaldoVenta(venta) {
  return Number(
    venta.saldoPendiente ??
    venta.saldo ??
    0
  );
}

function obtenerMontoPago(pago) {
  return Number(
    pago.montoTotal ??
    pago.monto ??
    pago.montoPago ??
    0
  );
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

function obtenerNombreCobrador(cobrador) {
  if (!cobrador) {
    return "No registrado";
  }

  const nombre = [
    cobrador.nombres,
    cobrador.apellidoPaterno,
    cobrador.apellidoMaterno
  ]
    .filter(Boolean)
    .join(" ");

  return nombre || "Cobrador";
}

function obtenerClaseEstado(
  estado,
  saldo
) {
  if (
    saldo <= 0 ||
    estado === "PAGADA" ||
    estado === "FINALIZADA"
  ) {
    return "pagada";
  }

  if (estado === "VENCIDA") {
    return "vencida";
  }

  return "pendiente";
}

function formatearEstado(
  estado,
  saldo
) {
  if (saldo <= 0) {
    return "PAGADA";
  }

  const estados = {
    ACTIVA: "ACTIVA",
    PENDIENTE: "PENDIENTE",
    VENCIDA: "VENCIDA",
    PAGADA: "PAGADA",
    FINALIZADA: "FINALIZADA"
  };

  return estados[estado] || estado;
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
  if (!fecha) {
    return "";
  }

  return String(fecha).substring(0, 10);
}

function formatearFecha(fecha) {
  const fechaLimpia =
    obtenerParteFecha(fecha);

  if (!fechaLimpia) {
    return "No registrada";
  }

  return new Date(
    `${fechaLimpia}T00:00:00`
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

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}