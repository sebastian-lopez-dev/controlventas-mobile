import { apiFetch } from "./api.js";

export async function mostrarContrato(usuario, volverAlInicio) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverContratos"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Contratos</h1>
            <p>Ventas registradas</p>
          </div>

          <button
            type="button"
            id="btnNuevoContrato"
            class="btn-agregar-cabecera"
          >
            + Nuevo
          </button>
        </div>
      </header>

      <section class="contenido-contratos">

        <div id="listaContratos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando contratos...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverContratos")
    .addEventListener("click", volverAlInicio);

  document.querySelector("#btnNuevoContrato").addEventListener("click", () => {
    mostrarFormularioNuevoContrato(usuario, () =>
      mostrarContrato(usuario, volverAlInicio),
    );
  });

  try {
    const ventas = await apiFetch("/ventas");

    renderizarListaContratos(ventas, usuario);

    activarVerDetalleContratos(usuario, volverAlInicio);
    activarEliminarContratos(ventas, usuario, volverAlInicio);
  } catch (error) {
    document.querySelector("#listaContratos").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los contratos</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarListaContratos(ventas, usuario) {
  const lista = document.querySelector("#listaContratos");

  if (ventas.length === 0) {
    lista.innerHTML = `
      <div class="historial-vacio">
        <div>📄</div>

        <h2>No hay contratos registrados</h2>

        <p>
          Presiona “Nuevo” para registrar
          una venta al crédito.
        </p>
      </div>
    `;

    return;
  }

  const ventasOrdenadas = [...ventas].sort(
    (ventaA, ventaB) => Number(ventaB.idVenta) - Number(ventaA.idVenta),
  );

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${ventas.length}
      ${ventas.length === 1 ? "contrato" : "contratos"}
    </div>

    <div class="lista-contratos">
      ${ventasOrdenadas
        .map((venta) => crearTarjetaContrato(venta, usuario))
        .join("")}
    </div>

    <p
      id="mensajeContratos"
      class="aviso-accion"
    ></p>
  `;
}

function crearTarjetaContrato(venta, usuario) {
  const cliente = venta.cliente || {};

  const nombreCliente = [
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");

  const productos = (venta.detalles || [])
    .map((detalle) => detalle.nombreProducto || detalle.producto?.nombre)
    .filter(Boolean)
    .join(", ");

  const estado = venta.estado || "ACTIVA";

  return `
    <article class="tarjeta-contrato-lista">

      <div class="contrato-lista-encabezado">

        <div>
          <span>
            ${escaparTexto(venta.numeroContrato || `CTR-${venta.idVenta}`)}
          </span>

          <h2>
            ${escaparTexto(nombreCliente || "Cliente no disponible")}
          </h2>

          <p>
            ${formatearFecha(venta.fechaVenta)}
          </p>
        </div>

        <strong
          class="estado-contrato-lista ${estado.toLowerCase()}"
        >
          ${escaparTexto(estado)}
        </strong>

      </div>

      <div class="producto-contrato-lista">
        <span>Producto</span>

        <strong>
          ${escaparTexto(productos || "Producto no disponible")}
        </strong>
      </div>

      <div class="resumen-contrato-lista">

        <div>
          <span>Total</span>

          <strong>
            ${formatearDinero(venta.totalVenta)}
          </strong>
        </div>

        <div>
          <span>Saldo</span>

          <strong>
            ${formatearDinero(venta.saldoPendiente)}
          </strong>
        </div>

      </div>

      <div class="acciones-contrato-lista">
        <button
          type="button"
          class="btn-ver-detalle-contrato"
          data-ver-contrato="${venta.idVenta}"
        >
          Ver detalle
        </button>

        ${
          usuario.rol === "ADMINISTRADOR"
            ? `
            <button
              type="button"
              class="btn-eliminar-contrato"
              data-eliminar-contrato="${venta.idVenta}"
            >
              Eliminar contrato
            </button>
          `
            : ""
        }
      </div>

    </article>
  `;
}

function activarVerDetalleContratos(usuario, volverAlInicio) {
  document.querySelectorAll("[data-ver-contrato]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idVenta = Number(boton.dataset.verContrato);

      mostrarDetalleContrato(idVenta, () =>
        mostrarContrato(usuario, volverAlInicio),
      );
    });
  });
}

async function mostrarDetalleContrato(idVenta, volverAContratos) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverDetalleContrato"
          class="btn-volver"
          aria-label="Volver a contratos"
        >
          ‹
        </button>

        <div>
          <h1>Detalle del contrato</h1>
          <p>Información completa de la venta</p>
        </div>
      </header>

      <section
        id="contenidoDetalleContrato"
        class="contenido-detalle-contrato"
      >
        <div class="estado-cargando">
          <div class="cargador"></div>
          <p>Cargando contrato...</p>
        </div>
      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverDetalleContrato")
    .addEventListener("click", volverAContratos);

  try {
    const [venta, cuotas] = await Promise.all([
      apiFetch(`/ventas/${idVenta}`),
      apiFetch(`/ventas/${idVenta}/cuotas`),
    ]);

    renderizarDetalleContrato(venta, cuotas, volverAContratos);
  } catch (error) {
    document.querySelector("#contenidoDetalleContrato").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudo cargar el contrato</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarDetalleContrato(venta, cuotas, volverAContratos) {
  const cliente = venta.cliente || {};
  const cobrador = venta.cobrador || {};
  const salida = venta.salida || {};
  const estado = venta.estado || "ACTIVA";
  const detalles = venta.detalles || [];

  document.querySelector("#contenidoDetalleContrato").innerHTML = `
    <article class="detalle-contrato-portada">
      <div>
        <span>CONTRATO</span>

        <h2>
          ${escaparTexto(venta.numeroContrato || `CTR-${venta.idVenta}`)}
        </h2>

        <p>
          ${escaparTexto(obtenerNombreCompleto(cliente) || "Cliente")}
          · ${formatearFecha(venta.fechaVenta)}
        </p>
      </div>

      <strong class="estado-contrato-lista ${estado.toLowerCase()}">
        ${escaparTexto(estado)}
      </strong>
    </article>

    <section class="detalle-contrato-bloque">
      <div class="titulo-detalle-contrato">
        <span aria-hidden="true">👤</span>
        <h2>Datos del cliente</h2>
      </div>

      <h3 class="nombre-cliente-detalle">
        ${escaparTexto(obtenerNombreCompleto(cliente) || "Cliente")}
      </h3>

      <div class="detalle-datos-grid">
        ${crearDatoDetalle("Código", cliente.codigoCliente)}
        ${crearDatoDetalle("DNI", cliente.dni)}
        ${crearDatoDetalle("Celular", cliente.celular)}
        ${crearDatoDetalle("Zona", cliente.zona || cliente.distrito)}
      </div>

      <div class="dato-detalle-ancho">
        <span>Dirección</span>
        <strong>
          ${escaparTexto(cliente.direccion || "No registrada")}
        </strong>
      </div>
    </section>

    <section class="detalle-contrato-bloque">
      <div class="titulo-detalle-contrato">
        <span aria-hidden="true">📦</span>
        <h2>Productos vendidos</h2>
      </div>

      ${crearProductosDetalleContrato(detalles)}
    </section>

    <section class="detalle-contrato-bloque">
      <div class="titulo-detalle-contrato">
        <span aria-hidden="true">S/</span>
        <h2>Resumen del crédito</h2>
      </div>

      <div class="resumen-financiero-contrato">
        ${crearMontoDetalle("Total", venta.totalVenta)}
        ${crearMontoDetalle("Cuota inicial", venta.cuotaInicial)}
        ${crearMontoDetalle("Saldo pendiente", venta.saldoPendiente, true)}
        ${crearMontoDetalle("Monto por cuota", venta.montoCuota)}
      </div>

      <div class="detalle-datos-grid detalle-condiciones-contrato">
        ${crearDatoDetalle(
          "Modalidad",
          formatearModalidad(venta.modalidadPago),
        )}
        ${crearDatoDetalle("Primer pago", formatearFecha(venta.fechaPrimerPago))}
        ${
          venta.diaPago
            ? crearDatoDetalle("Día de pago", formatearDiaPago(venta.diaPago))
            : ""
        }
        ${crearDatoDetalle(
          "Cobrador",
          obtenerNombreCompleto(cobrador) || "No asignado",
        )}
      </div>

      <div class="dato-detalle-ancho">
        <span>Ruta</span>
        <strong>${escaparTexto(salida.destino || "No registrada")}</strong>
      </div>

      <div class="dato-detalle-ancho">
        <span>Observaciones</span>
        <strong>
          ${escaparTexto(venta.observaciones || "Sin observaciones")}
        </strong>
      </div>
    </section>

    <section class="detalle-contrato-bloque">
      <div class="titulo-detalle-contrato">
        <span aria-hidden="true">✍</span>
        <h2>Firma del cliente</h2>
      </div>

      ${
        venta.firmaCliente
          ? `
            <div class="firma-cliente-detalle">
              <img
                src="${escaparTexto(venta.firmaCliente)}"
                alt="Firma del cliente"
              >
            </div>
          `
          : `
            <p class="detalle-vacio">
              No hay una firma guardada para este contrato.
            </p>
          `
      }
    </section>

    <section class="detalle-contrato-bloque">
      <div class="titulo-detalle-contrato">
        <span aria-hidden="true">📅</span>
        <div>
          <h2>Cronograma de cuotas</h2>
          <p>${cuotas.length} ${cuotas.length === 1 ? "cuota" : "cuotas"}</p>
        </div>
      </div>

      ${crearCuotasDetalleContrato(cuotas)}
    </section>

    <button
      type="button"
      id="btnRegresarAContratos"
      class="btn-guardar-formulario"
    >
      Volver a contratos
    </button>
  `;

  document
    .querySelector("#btnRegresarAContratos")
    .addEventListener("click", volverAContratos);
}

function crearProductosDetalleContrato(detalles) {
  if (detalles.length === 0) {
    return `
      <p class="detalle-vacio">
        No hay productos registrados en este contrato.
      </p>
    `;
  }

  return `
    <div class="lista-productos-contrato-detalle">
      ${detalles
        .map((detalle, indice) => {
          const nombre =
            detalle.nombreProducto || detalle.producto?.nombre || "Producto";

          const caracteristicas = [
            detalle.modelo && `Modelo: ${detalle.modelo}`,
            detalle.color && `Color: ${detalle.color}`,
            detalle.talla && `Talla: ${detalle.talla}`,
          ].filter(Boolean);

          return `
            <article class="producto-contrato-detalle">
              <span>PRODUCTO ${indice + 1}</span>
              <h3>${escaparTexto(nombre)}</h3>

              <div class="producto-detalle-numeros">
                ${crearDatoDetalle("Cantidad", detalle.cantidad)}
                ${crearDatoDetalle(
                  "Precio unitario",
                  formatearDinero(detalle.precioUnitario),
                )}
                ${crearDatoDetalle(
                  "Subtotal",
                  formatearDinero(detalle.subtotal),
                )}
              </div>

              ${
                caracteristicas.length > 0
                  ? `<p>${escaparTexto(caracteristicas.join(" · "))}</p>`
                  : ""
              }
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function crearCuotasDetalleContrato(cuotas) {
  if (cuotas.length === 0) {
    return `
      <p class="detalle-vacio">
        Este contrato no tiene cuotas registradas.
      </p>
    `;
  }

  return `
    <div class="lista-cuotas-contrato-detalle">
      ${cuotas
        .map((cuota) => {
          const estado = cuota.estado || "PENDIENTE";

          return `
            <article class="cuota-contrato-detalle">
              <div class="cuota-detalle-encabezado">
                <div>
                  <span>CUOTA N.º ${cuota.numeroCuota}</span>
                  <strong>${formatearFecha(cuota.fechaVencimiento)}</strong>
                </div>

                <b class="estado-cuota-detalle ${estado.toLowerCase()}">
                  ${escaparTexto(formatearEstadoCuota(estado))}
                </b>
              </div>

              <div class="cuota-detalle-montos">
                ${crearMontoDetalle("Programado", cuota.montoProgramado)}
                ${crearMontoDetalle("Pagado", cuota.montoPagado)}
                ${crearMontoDetalle("Pendiente", cuota.saldoCuota, true)}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function crearDatoDetalle(etiqueta, valor) {
  const texto =
    valor === null || valor === undefined || valor === ""
      ? "No registrado"
      : valor;

  return `
    <div class="dato-detalle">
      <span>${escaparTexto(etiqueta)}</span>
      <strong>${escaparTexto(texto)}</strong>
    </div>
  `;
}

function crearMontoDetalle(etiqueta, valor, destacado = false) {
  return `
    <div class="monto-detalle ${destacado ? "destacado" : ""}">
      <span>${escaparTexto(etiqueta)}</span>
      <strong>${formatearDinero(valor)}</strong>
    </div>
  `;
}

function obtenerNombreCompleto(persona) {
  return [persona?.nombres, persona?.apellidoPaterno, persona?.apellidoMaterno]
    .filter(Boolean)
    .join(" ");
}

function formatearModalidad(modalidad) {
  const modalidades = {
    DIARIO: "Diario",
    SEMANAL: "Semanal",
    QUINCENAL: "Quincenal",
    MENSUAL: "Mensual",
  };

  return modalidades[modalidad] || modalidad || "No registrada";
}

function formatearDiaPago(dia) {
  const dias = {
    LUNES: "Lunes",
    MARTES: "Martes",
    MIERCOLES: "Miércoles",
    JUEVES: "Jueves",
    VIERNES: "Viernes",
    SABADO: "Sábado",
    DOMINGO: "Domingo",
  };

  return dias[dia] || dia;
}

function formatearEstadoCuota(estado) {
  const estados = {
    PENDIENTE: "Pendiente",
    PARCIAL: "Pago parcial",
    PAGADA: "Pagada",
    VENCIDA: "Vencida",
  };

  return estados[estado] || estado;
}

function activarEliminarContratos(ventas, usuario, volverAlInicio) {
  document.querySelectorAll("[data-eliminar-contrato]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const idVenta = Number(boton.dataset.eliminarContrato);

      const venta = ventas.find((item) => item.idVenta === idVenta);

      const confirmado = window.confirm(
        "¿Eliminar el contrato " +
          `${venta.numeroContrato}?\n\n` +
          "Las cuotas serán eliminadas " +
          "y la mercadería regresará al carro.",
      );

      if (!confirmado) {
        return;
      }

      const mensaje = document.querySelector("#mensajeContratos");

      boton.disabled = true;
      boton.textContent = "Eliminando...";

      try {
        await apiFetch(`/ventas/${idVenta}`, {
          method: "DELETE",
        });

        await mostrarContrato(usuario, volverAlInicio);
      } catch (error) {
        mensaje.textContent = error.message;

        mensaje.classList.add("error");

        boton.disabled = false;
        boton.textContent = "Eliminar contrato";
      }
    });
  });
}
async function mostrarFormularioNuevoContrato(usuario, volverAlInicio) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverContrato"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Nuevo contrato</h1>
          <p>Registrar venta al crédito</p>
        </div>
      </header>

      <section
        id="contenidoContrato"
        class="contenido-formulario"
      >
        <div class="estado-cargando">
          <div class="cargador"></div>
          <p>Preparando contrato...</p>
        </div>
      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverContrato")
    .addEventListener("click", volverAlInicio);

  try {
    const [clientes, salidas, cobradores] = await Promise.all([
      apiFetch("/clientes"),
      apiFetch("/salidas"),
      apiFetch("/cobradores/activos"),
    ]);

    const salidaAbierta = salidas.find((salida) => salida.estado === "ABIERTA");

    if (!salidaAbierta) {
      mostrarErrorContrato(
        "Primero debes abrir una salida " + "y cargar mercadería al carro.",
      );

      return;
    }

    const productosCarro = (salidaAbierta.detalles || []).filter((detalle) => {
      return obtenerStockEsperado(detalle) > 0;
    });

    if (productosCarro.length === 0) {
      mostrarErrorContrato(
        "La salida abierta no tiene productos " + "disponibles para vender.",
      );

      return;
    }

    const clientesActivos = clientes.filter((cliente) => cliente.activo);

    if (clientesActivos.length === 0) {
      mostrarErrorContrato("Primero debes registrar un cliente activo.");

      return;
    }

    if (cobradores.length === 0) {
      mostrarErrorContrato("No existe un cobrador activo.");

      return;
    }

    renderizarFormularioContrato(
      usuario,
      salidaAbierta,
      clientesActivos,
      productosCarro,
      cobradores,
      volverAlInicio,
    );
  } catch (error) {
    mostrarErrorContrato(error.message);
  }
}

function renderizarFormularioContrato(
  usuario,
  salida,
  clientes,
  productosCarro,
  cobradores,
  volverAlInicio,
) {
  const clienteGuardado = leerLocalStorage("controlventas_cliente_contrato");

  const productoGuardado = leerLocalStorage("controlventas_producto_contrato");

  document.querySelector("#contenidoContrato").innerHTML = `
    <form
      id="formContrato"
      class="formulario-movil"
    >

      <article class="salida-contrato">
        <span>SALIDA ABIERTA</span>

        <h2>
          ${escaparTexto(salida.destino)}
        </h2>

        <p>
          ${formatearFecha(salida.fechaSalida)}
        </p>
      </article>

      <div class="grupo-formulario">
        <h2>1. Cliente</h2>

        <label for="buscarClienteContrato">
          Buscar comprador
        </label>

        <div class="buscador-contrato">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            id="buscarClienteContrato"
            placeholder="Nombre, DNI o código"
            autocomplete="off"
          >
        </div>

        <p
          id="resultadoBusquedaCliente"
          class="resultado-buscador-contrato"
          aria-live="polite"
        ></p>

        <label>
          Seleccionar comprador

          <select id="contratoCliente" required>
            <option value="">
              Seleccionar cliente
            </option>

            ${clientes
              .map((cliente) => {
                const nombre = [
                  cliente.nombres,
                  cliente.apellidoPaterno,
                  cliente.apellidoMaterno,
                ]
                  .filter(Boolean)
                  .join(" ");

                const seleccionado =
                  clienteGuardado?.idCliente === cliente.idCliente;

                return `
                  <option
                    value="${cliente.idCliente}"
                    ${seleccionado ? "selected" : ""}
                  >
                    ${escaparTexto(nombre)}
                    · ${escaparTexto(cliente.codigoCliente)}
                  </option>
                `;
              })
              .join("")}
          </select>
        </label>

        <div
          id="resumenClienteContrato"
          class="resumen-seleccion"
        ></div>
      </div>

      <div class="grupo-formulario">
        <h2>2. Producto</h2>

        <label for="buscarProductoContrato">
          Buscar producto
        </label>

        <div class="buscador-contrato">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            id="buscarProductoContrato"
            placeholder="Nombre, código o marca"
            autocomplete="off"
          >
        </div>

        <p
          id="resultadoBusquedaProducto"
          class="resultado-buscador-contrato"
          aria-live="polite"
        ></p>

        <label>
          Producto del carro

          <select id="contratoProducto" required>
            <option value="">
              Seleccionar producto
            </option>

            ${productosCarro
              .map((detalle) => {
                const producto = detalle.producto;

                const seleccionado =
                  productoGuardado?.idProducto === producto.idProducto;

                return `
                  <option
                    value="${producto.idProducto}"
                    ${seleccionado ? "selected" : ""}
                  >
                    ${escaparTexto(producto.nombre)}
                    · Disponible:
                    ${obtenerStockEsperado(detalle)}
                  </option>
                `;
              })
              .join("")}
          </select>
        </label>

        <div class="fila-formulario">
          <label>
            Cantidad

            <input
              type="number"
              id="contratoCantidad"
              min="1"
              value="1"
              required
            >
          </label>

          <label>
            Precio unitario

            <input
              type="number"
              id="contratoPrecio"
              min="0.01"
              step="0.01"
              required
            >
          </label>
        </div>

        <div
          id="resumenProductoContrato"
          class="resumen-seleccion"
        ></div>
      </div>

      <div class="grupo-formulario">
        <h2>3. Forma de pago</h2>

        <div class="fila-formulario">
          <label>
            Fecha de venta

            <input
              type="date"
              id="contratoFechaVenta"
              required
            >
          </label>

          <label>
            Cuota inicial

            <input
              type="number"
              id="contratoInicial"
              min="0"
              step="0.01"
              value="0"
            >
          </label>
        </div>

        <label>
          Modalidad de pago

          <select
            id="contratoModalidad"
            required
          >
            <option value="DIARIO">
              Diario
            </option>

            <option value="SEMANAL">
              Semanal
            </option>

            <option value="QUINCENAL">
              Quincenal
            </option>

            <option value="MENSUAL">
              Mensual
            </option>
          </select>
        </label>

        <div
          id="contenedorDiaPago"
          class="campo-oculto"
        >
          <label>
            Día de pago semanal

            <select id="contratoDiaPago">
              <option value="LUNES">Lunes</option>
              <option value="MARTES">Martes</option>
              <option value="MIERCOLES">Miércoles</option>
              <option value="JUEVES">Jueves</option>
              <option value="VIERNES">Viernes</option>
              <option value="SABADO">Sábado</option>
              <option value="DOMINGO">Domingo</option>
            </select>
          </label>
        </div>

        <div class="fila-formulario">
          <label>
            Monto de cada cuota

            <input
              type="number"
              id="contratoMontoCuota"
              min="0.01"
              step="0.01"
              required
            >
          </label>

          <label>
            Primer pago

            <input
              type="date"
              id="contratoPrimerPago"
              required
            >
          </label>
        </div>

        <label>
          Cobrador

          <select id="contratoCobrador" required>
            <option value="">
              Seleccionar cobrador
            </option>

            ${cobradores
              .map((cobrador) => {
                const nombre = cobrador.nombres || "Cobrador";

                return `
                  <option
                    value="${cobrador.idCobrador}"
                  >
                    ${escaparTexto(nombre)}
                  </option>
                `;
              })
              .join("")}
          </select>
        </label>

        <label>
          Observaciones

          <textarea
            id="contratoObservaciones"
            rows="3"
            placeholder="Información adicional del contrato"
          ></textarea>
        </label>
      </div>

      <article class="resumen-total-contrato">

        <div>
          <span>Total de venta</span>
          <strong id="contratoTotal">
            S/ 0.00
          </strong>
        </div>

        <div>
          <span>Cuota inicial</span>
          <strong id="contratoResumenInicial">
            S/ 0.00
          </strong>
        </div>

        <div class="saldo">
          <span>Saldo a financiar</span>
          <strong id="contratoSaldo">
            S/ 0.00
          </strong>
        </div>

      </article>

      <label class="confirmacion-contrato">
        <input
          type="checkbox"
          id="contratoConfirmado"
          required
        >

        <span>
          Confirmo que el cliente recibió
          el producto y acepta las cuotas.
        </span>
      </label>

      <p
        id="mensajeContrato"
        class="mensaje-formulario"
      ></p>

      <button
        type="submit"
        id="btnGenerarContrato"
        class="btn-guardar-formulario"
      >
        Generar contrato
      </button>

    </form>
  `;

  const fechaActual = obtenerFechaActual();

  document.querySelector("#contratoFechaVenta").value = fechaActual;

  document.querySelector("#contratoPrimerPago").value = fechaActual;

  activarFormularioContrato(salida, clientes, productosCarro, volverAlInicio);
}

function activarFormularioContrato(
  salida,
  clientes,
  productosCarro,
  volverAlInicio,
) {
  const selectCliente = document.querySelector("#contratoCliente");

  const selectProducto = document.querySelector("#contratoProducto");

  const buscadorCliente = document.querySelector("#buscarClienteContrato");

  const buscadorProducto = document.querySelector("#buscarProductoContrato");

  const resultadoCliente = document.querySelector("#resultadoBusquedaCliente");

  const resultadoProducto = document.querySelector(
    "#resultadoBusquedaProducto",
  );

  const cantidad = document.querySelector("#contratoCantidad");

  const precio = document.querySelector("#contratoPrecio");

  const inicial = document.querySelector("#contratoInicial");

  const modalidad = document.querySelector("#contratoModalidad");

  function obtenerNombreCliente(cliente) {
    return [cliente.nombres, cliente.apellidoPaterno, cliente.apellidoMaterno]
      .filter(Boolean)
      .join(" ");
  }

  function cargarOpcionesClientes(clientesFiltrados, idSeleccionado) {
    selectCliente.innerHTML = `
      <option value="">
        ${
          clientesFiltrados.length > 0
            ? "Seleccionar cliente"
            : "No se encontraron clientes"
        }
      </option>

      ${clientesFiltrados
        .map((cliente) => {
          return `
            <option value="${cliente.idCliente}">
              ${escaparTexto(obtenerNombreCliente(cliente))}
              · ${escaparTexto(cliente.codigoCliente || "Sin código")}
            </option>
          `;
        })
        .join("")}
    `;

    selectCliente.disabled = clientesFiltrados.length === 0;

    const conservaSeleccion = clientesFiltrados.some(
      (cliente) => Number(cliente.idCliente) === Number(idSeleccionado),
    );

    if (conservaSeleccion) {
      selectCliente.value = String(idSeleccionado);
    } else if (clientesFiltrados.length === 1) {
      selectCliente.value = String(clientesFiltrados[0].idCliente);
    }
  }

  function cargarOpcionesProductos(productosFiltrados, idSeleccionado) {
    selectProducto.innerHTML = `
      <option value="">
        ${
          productosFiltrados.length > 0
            ? "Seleccionar producto"
            : "No se encontraron productos"
        }
      </option>

      ${productosFiltrados
        .map((detalle) => {
          const producto = detalle.producto;

          return `
            <option value="${producto.idProducto}">
              ${escaparTexto(producto.nombre)}
              · Disponible: ${obtenerStockEsperado(detalle)}
            </option>
          `;
        })
        .join("")}
    `;

    selectProducto.disabled = productosFiltrados.length === 0;

    const conservaSeleccion = productosFiltrados.some(
      (detalle) =>
        Number(detalle.producto.idProducto) === Number(idSeleccionado),
    );

    if (conservaSeleccion) {
      selectProducto.value = String(idSeleccionado);
    } else if (productosFiltrados.length === 1) {
      selectProducto.value = String(productosFiltrados[0].producto.idProducto);
    }
  }

  function filtrarClientes() {
    const texto = normalizarBusqueda(buscadorCliente.value);
    const idSeleccionado = Number(selectCliente.value);

    const clientesFiltrados = clientes.filter((cliente) => {
      const datosBusqueda = [
        obtenerNombreCliente(cliente),
        cliente.codigoCliente,
        cliente.dni,
        cliente.celular,
        cliente.zona,
        cliente.distrito,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizarBusqueda(datosBusqueda).includes(texto);
    });

    cargarOpcionesClientes(clientesFiltrados, idSeleccionado);

    resultadoCliente.textContent = texto
      ? `${clientesFiltrados.length} ${
          clientesFiltrados.length === 1
            ? "cliente encontrado"
            : "clientes encontrados"
        }`
      : "";

    actualizarCliente();
  }

  function filtrarProductos() {
    const texto = normalizarBusqueda(buscadorProducto.value);
    const idSeleccionado = Number(selectProducto.value);

    const productosFiltrados = productosCarro.filter((detalle) => {
      const producto = detalle.producto;

      const datosBusqueda = [
        producto.nombre,
        producto.codigo,
        producto.marca,
        producto.modelo,
        producto.categoria,
        producto.color,
        producto.talla,
      ]
        .filter(Boolean)
        .join(" ");

      return normalizarBusqueda(datosBusqueda).includes(texto);
    });

    cargarOpcionesProductos(productosFiltrados, idSeleccionado);

    resultadoProducto.textContent = texto
      ? `${productosFiltrados.length} ${
          productosFiltrados.length === 1
            ? "producto encontrado"
            : "productos encontrados"
        }`
      : "";

    actualizarProducto();
  }

  function actualizarCliente() {
    const idCliente = Number(selectCliente.value);

    const cliente = clientes.find((item) => item.idCliente === idCliente);

    const resumen = document.querySelector("#resumenClienteContrato");

    if (!cliente) {
      resumen.innerHTML = "";
      return;
    }

    resumen.innerHTML = `
      <strong>
        ${escaparTexto(cliente.nombres)}
        ${escaparTexto(cliente.apellidoPaterno)}
      </strong>

      <span>
        DNI:
        ${escaparTexto(cliente.dni || "No registrado")}
      </span>

      <span>
        ${escaparTexto(cliente.direccion || "Dirección no registrada")}
      </span>
    `;
  }

  function actualizarProducto() {
    const idProducto = Number(selectProducto.value);

    const detalle = productosCarro.find(
      (item) => item.producto.idProducto === idProducto,
    );

    const resumen = document.querySelector("#resumenProductoContrato");

    if (!detalle) {
      resumen.innerHTML = "";
      precio.value = "";
      actualizarTotales();
      return;
    }

    const producto = detalle.producto;
    const disponible = obtenerStockEsperado(detalle);

    cantidad.max = disponible;
    precio.value = Number(producto.precioVenta).toFixed(2);

    resumen.innerHTML = `
      <strong>
        ${escaparTexto(producto.nombre)}
      </strong>

      <span>
        Código:
        ${escaparTexto(producto.codigo)}
      </span>

      <span>
        Disponible en carro:
        ${disponible}
      </span>
    `;

    actualizarTotales();
  }

  function actualizarTotales() {
    const total = Number(cantidad.value || 0) * Number(precio.value || 0);

    const cuotaInicial = Number(inicial.value || 0);

    const saldo = Math.max(total - cuotaInicial, 0);

    document.querySelector("#contratoTotal").textContent =
      formatearDinero(total);

    document.querySelector("#contratoResumenInicial").textContent =
      formatearDinero(cuotaInicial);

    document.querySelector("#contratoSaldo").textContent =
      formatearDinero(saldo);
  }

  function actualizarModalidad() {
    const contenedor = document.querySelector("#contenedorDiaPago");

    contenedor.classList.toggle("campo-oculto", modalidad.value !== "SEMANAL");
  }

  selectCliente.addEventListener("change", actualizarCliente);

  selectProducto.addEventListener("change", actualizarProducto);

  buscadorCliente.addEventListener("input", filtrarClientes);

  buscadorProducto.addEventListener("input", filtrarProductos);

  cantidad.addEventListener("input", actualizarTotales);

  precio.addEventListener("input", actualizarTotales);

  inicial.addEventListener("input", actualizarTotales);

  modalidad.addEventListener("change", actualizarModalidad);

  actualizarCliente();
  actualizarProducto();
  actualizarModalidad();

  document
    .querySelector("#formContrato")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await guardarContrato(salida, productosCarro, volverAlInicio);
    });
}

async function guardarContrato(salida, productosCarro, volverAlInicio) {
  const mensaje = document.querySelector("#mensajeContrato");

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  const idProducto = Number(document.querySelector("#contratoProducto").value);

  const detalleSalida = productosCarro.find(
    (item) => item.producto.idProducto === idProducto,
  );

  const cantidad = Number(document.querySelector("#contratoCantidad").value);

  const precio = Number(document.querySelector("#contratoPrecio").value);

  const cuotaInicial = Number(
    document.querySelector("#contratoInicial").value || 0,
  );

  const montoCuota = Number(
    document.querySelector("#contratoMontoCuota").value,
  );

  const total = cantidad * precio;
  const saldo = total - cuotaInicial;

  if (!detalleSalida) {
    mostrarErrorMensaje(mensaje, "Selecciona un producto.");
    return;
  }

  if (cantidad <= 0 || cantidad > obtenerStockEsperado(detalleSalida)) {
    mostrarErrorMensaje(mensaje, "La cantidad supera el stock del carro.");
    return;
  }

  if (precio <= 0) {
    mostrarErrorMensaje(mensaje, "El precio debe ser mayor que cero.");
    return;
  }

  if (cuotaInicial < 0 || cuotaInicial >= total) {
    mostrarErrorMensaje(mensaje, "La inicial debe ser menor que el total.");
    return;
  }

  if (montoCuota <= 0 || montoCuota > saldo) {
    mostrarErrorMensaje(
      mensaje,
      "La cuota debe ser mayor que cero " + "y no superar el saldo.",
    );
    return;
  }

  const modalidad = document.querySelector("#contratoModalidad").value;

  const solicitud = {
    idCliente: Number(document.querySelector("#contratoCliente").value),

    idSalida: salida.idSalida,

    idCobrador: Number(document.querySelector("#contratoCobrador").value),

    fechaVenta: document.querySelector("#contratoFechaVenta").value,

    cuotaInicial,

    modalidadPago: modalidad,

    montoCuota,

    diaPago:
      modalidad === "SEMANAL"
        ? document.querySelector("#contratoDiaPago").value
        : null,

    fechaPrimerPago: document.querySelector("#contratoPrimerPago").value,

    observaciones: obtenerValorONull("#contratoObservaciones"),

    detalles: [
      {
        idProducto,
        cantidad,
        precioUnitario: precio,
      },
    ],
  };

  const boton = document.querySelector("#btnGenerarContrato");

  boton.disabled = true;
  boton.textContent = "Generando contrato...";

  try {
    const venta = await apiFetch("/ventas", {
      method: "POST",
      body: JSON.stringify(solicitud),
    });

    localStorage.removeItem("controlventas_cliente_contrato");

    localStorage.removeItem("controlventas_producto_contrato");

    mostrarContratoGenerado(venta, volverAlInicio);
  } catch (error) {
    mostrarErrorMensaje(mensaje, error.message);

    boton.disabled = false;
    boton.textContent = "Generar contrato";
  }
}

function mostrarContratoGenerado(venta, volverAlInicio) {
  document.querySelector("#contenidoContrato").innerHTML = `
    <div class="contrato-generado">

      <div class="icono-contrato-generado">
        ✓
      </div>

      <span>CONTRATO GENERADO</span>

      <h2>
        ${escaparTexto(venta.numeroContrato)}
      </h2>

      <p>
        La venta y las cuotas fueron
        guardadas correctamente.
      </p>

      <div class="resumen-contrato-generado">

        <div>
          <span>Total</span>
          <strong>
            ${formatearDinero(venta.totalVenta)}
          </strong>
        </div>

        <div>
          <span>Inicial</span>
          <strong>
            ${formatearDinero(venta.cuotaInicial)}
          </strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong>
            ${formatearDinero(venta.saldoPendiente)}
          </strong>
        </div>

      </div>

      <button
        type="button"
        id="btnFinalizarContrato"
        class="btn-guardar-formulario"
      >
        Volver a contratos
      </button>

    </div>
  `;

  document
    .querySelector("#btnFinalizarContrato")
    .addEventListener("click", volverAlInicio);
}

function mostrarErrorContrato(mensaje) {
  document.querySelector("#contenidoContrato").innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se puede crear el contrato</h2>
      <p>${escaparTexto(mensaje)}</p>
    </div>
  `;
}

function mostrarErrorMensaje(elemento, mensaje) {
  elemento.textContent = mensaje;
  elemento.classList.add("error");
}

function obtenerStockEsperado(detalle) {
  return Number(
    detalle.stockEsperado ??
      Number(detalle.cantidadCargada || 0) -
        Number(detalle.cantidadVendida || 0),
  );
}

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function normalizarBusqueda(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE");
}

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });
}

function obtenerValorONull(selector) {
  const valor = document.querySelector(selector).value.trim();

  return valor || null;
}

function leerLocalStorage(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
