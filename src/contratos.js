import { apiFetch } from "./api.js";

export async function mostrarContrato(
  usuario,
  volverAlInicio
) {
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
    const [
      clientes,
      salidas,
      cobradores
    ] = await Promise.all([
      apiFetch("/clientes"),
      apiFetch("/salidas"),
      apiFetch("/cobradores/activos")
    ]);

    const salidaAbierta = salidas.find(
      (salida) => salida.estado === "ABIERTA"
    );

    if (!salidaAbierta) {
      mostrarErrorContrato(
        "Primero debes abrir una salida " +
        "y cargar mercadería al carro."
      );

      return;
    }

    const productosCarro = (
      salidaAbierta.detalles || []
    ).filter((detalle) => {
      return obtenerStockEsperado(detalle) > 0;
    });

    if (productosCarro.length === 0) {
      mostrarErrorContrato(
        "La salida abierta no tiene productos " +
        "disponibles para vender."
      );

      return;
    }

    const clientesActivos = clientes.filter(
      (cliente) => cliente.activo
    );

    if (clientesActivos.length === 0) {
      mostrarErrorContrato(
        "Primero debes registrar un cliente activo."
      );

      return;
    }

    if (cobradores.length === 0) {
      mostrarErrorContrato(
        "No existe un cobrador activo."
      );

      return;
    }

    renderizarFormularioContrato(
      usuario,
      salidaAbierta,
      clientesActivos,
      productosCarro,
      cobradores,
      volverAlInicio
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
  volverAlInicio
) {
  const clienteGuardado = leerLocalStorage(
    "controlventas_cliente_contrato"
  );

  const productoGuardado = leerLocalStorage(
    "controlventas_producto_contrato"
  );

  document.querySelector(
    "#contenidoContrato"
  ).innerHTML = `
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
          Salida N.º ${salida.idSalida}
          · ${formatearFecha(salida.fechaSalida)}
        </p>
      </article>

      <div class="grupo-formulario">
        <h2>1. Cliente</h2>

        <label>
          Seleccionar comprador <b>*</b>

          <select id="contratoCliente" required>
            <option value="">
              Seleccionar cliente
            </option>

            ${clientes
              .map((cliente) => {
                const nombre = [
                  cliente.nombres,
                  cliente.apellidoPaterno,
                  cliente.apellidoMaterno
                ]
                  .filter(Boolean)
                  .join(" ");

                const seleccionado =
                  clienteGuardado?.idCliente ===
                  cliente.idCliente;

                return `
                  <option
                    value="${cliente.idCliente}"
                    ${seleccionado ? "selected" : ""}
                  >
                    ${escaparTexto(nombre)}
                    · ${escaparTexto(
                      cliente.codigoCliente
                    )}
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

        <label>
          Producto del carro <b>*</b>

          <select id="contratoProducto" required>
            <option value="">
              Seleccionar producto
            </option>

            ${productosCarro
              .map((detalle) => {
                const producto = detalle.producto;

                const seleccionado =
                  productoGuardado?.idProducto ===
                  producto.idProducto;

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
            Cantidad <b>*</b>

            <input
              type="number"
              id="contratoCantidad"
              min="1"
              value="1"
              required
            >
          </label>

          <label>
            Precio unitario <b>*</b>

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
            Fecha de venta <b>*</b>

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
          Modalidad de pago <b>*</b>

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
            Día de pago semanal <b>*</b>

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
            Monto de cada cuota <b>*</b>

            <input
              type="number"
              id="contratoMontoCuota"
              min="0.01"
              step="0.01"
              required
            >
          </label>

          <label>
            Primer pago <b>*</b>

            <input
              type="date"
              id="contratoPrimerPago"
              required
            >
          </label>
        </div>

        <label>
          Cobrador <b>*</b>

          <select id="contratoCobrador" required>
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

      <div class="grupo-formulario">
        <h2>4. Firma del cliente</h2>

        <p class="ayuda-formulario">
          El comprador debe firmar con el dedo
          dentro del recuadro.
        </p>

        <canvas
          id="lienzoFirma"
          width="700"
          height="280"
        ></canvas>

        <button
          type="button"
          id="btnLimpiarFirma"
          class="btn-limpiar-firma"
        >
          Limpiar firma
        </button>
      </div>

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

  document.querySelector(
    "#contratoFechaVenta"
  ).value = fechaActual;

  document.querySelector(
    "#contratoPrimerPago"
  ).value = fechaActual;

  activarFormularioContrato(
    salida,
    clientes,
    productosCarro,
    volverAlInicio
  );
}

function activarFormularioContrato(
  salida,
  clientes,
  productosCarro,
  volverAlInicio
) {
  const selectCliente = document.querySelector(
    "#contratoCliente"
  );

  const selectProducto = document.querySelector(
    "#contratoProducto"
  );

  const cantidad = document.querySelector(
    "#contratoCantidad"
  );

  const precio = document.querySelector(
    "#contratoPrecio"
  );

  const inicial = document.querySelector(
    "#contratoInicial"
  );

  const modalidad = document.querySelector(
    "#contratoModalidad"
  );

  const firma = prepararFirma();

  function actualizarCliente() {
    const idCliente = Number(
      selectCliente.value
    );

    const cliente = clientes.find(
      (item) => item.idCliente === idCliente
    );

    const resumen = document.querySelector(
      "#resumenClienteContrato"
    );

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
        ${escaparTexto(
          cliente.dni || "No registrado"
        )}
      </span>

      <span>
        ${escaparTexto(
          cliente.direccion ||
          "Dirección no registrada"
        )}
      </span>
    `;
  }

  function actualizarProducto() {
    const idProducto = Number(
      selectProducto.value
    );

    const detalle = productosCarro.find(
      (item) =>
        item.producto.idProducto === idProducto
    );

    const resumen = document.querySelector(
      "#resumenProductoContrato"
    );

    if (!detalle) {
      resumen.innerHTML = "";
      precio.value = "";
      actualizarTotales();
      return;
    }

    const producto = detalle.producto;
    const disponible = obtenerStockEsperado(
      detalle
    );

    cantidad.max = disponible;
    precio.value = Number(
      producto.precioVenta
    ).toFixed(2);

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
    const total =
      Number(cantidad.value || 0) *
      Number(precio.value || 0);

    const cuotaInicial = Number(
      inicial.value || 0
    );

    const saldo = Math.max(
      total - cuotaInicial,
      0
    );

    document.querySelector(
      "#contratoTotal"
    ).textContent = formatearDinero(total);

    document.querySelector(
      "#contratoResumenInicial"
    ).textContent = formatearDinero(
      cuotaInicial
    );

    document.querySelector(
      "#contratoSaldo"
    ).textContent = formatearDinero(saldo);
  }

  function actualizarModalidad() {
    const contenedor = document.querySelector(
      "#contenedorDiaPago"
    );

    contenedor.classList.toggle(
      "campo-oculto",
      modalidad.value !== "SEMANAL"
    );
  }

  selectCliente.addEventListener(
    "change",
    actualizarCliente
  );

  selectProducto.addEventListener(
    "change",
    actualizarProducto
  );

  cantidad.addEventListener(
    "input",
    actualizarTotales
  );

  precio.addEventListener(
    "input",
    actualizarTotales
  );

  inicial.addEventListener(
    "input",
    actualizarTotales
  );

  modalidad.addEventListener(
    "change",
    actualizarModalidad
  );

  actualizarCliente();
  actualizarProducto();
  actualizarModalidad();

  document
    .querySelector("#formContrato")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await guardarContrato(
        salida,
        productosCarro,
        firma,
        volverAlInicio
      );
    });
}

async function guardarContrato(
  salida,
  productosCarro,
  firma,
  volverAlInicio
) {
  const mensaje = document.querySelector(
    "#mensajeContrato"
  );

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  const idProducto = Number(
    document.querySelector(
      "#contratoProducto"
    ).value
  );

  const detalleSalida = productosCarro.find(
    (item) =>
      item.producto.idProducto === idProducto
  );

  const cantidad = Number(
    document.querySelector(
      "#contratoCantidad"
    ).value
  );

  const precio = Number(
    document.querySelector(
      "#contratoPrecio"
    ).value
  );

  const cuotaInicial = Number(
    document.querySelector(
      "#contratoInicial"
    ).value || 0
  );

  const montoCuota = Number(
    document.querySelector(
      "#contratoMontoCuota"
    ).value
  );

  const total = cantidad * precio;
  const saldo = total - cuotaInicial;

  if (!detalleSalida) {
    mostrarErrorMensaje(
      mensaje,
      "Selecciona un producto."
    );
    return;
  }

  if (
    cantidad <= 0 ||
    cantidad > obtenerStockEsperado(
      detalleSalida
    )
  ) {
    mostrarErrorMensaje(
      mensaje,
      "La cantidad supera el stock del carro."
    );
    return;
  }

  if (precio <= 0) {
    mostrarErrorMensaje(
      mensaje,
      "El precio debe ser mayor que cero."
    );
    return;
  }

  if (
    cuotaInicial < 0 ||
    cuotaInicial >= total
  ) {
    mostrarErrorMensaje(
      mensaje,
      "La inicial debe ser menor que el total."
    );
    return;
  }

  if (
    montoCuota <= 0 ||
    montoCuota > saldo
  ) {
    mostrarErrorMensaje(
      mensaje,
      "La cuota debe ser mayor que cero " +
      "y no superar el saldo."
    );
    return;
  }

  if (!firma.estaFirmado()) {
    mostrarErrorMensaje(
      mensaje,
      "El cliente debe firmar el contrato."
    );
    return;
  }

  const modalidad = document.querySelector(
    "#contratoModalidad"
  ).value;

  const solicitud = {
    idCliente: Number(
      document.querySelector(
        "#contratoCliente"
      ).value
    ),

    idSalida: salida.idSalida,

    idCobrador: Number(
      document.querySelector(
        "#contratoCobrador"
      ).value
    ),

    fechaVenta: document.querySelector(
      "#contratoFechaVenta"
    ).value,

    cuotaInicial,

    modalidadPago: modalidad,

    montoCuota,

    diaPago:
      modalidad === "SEMANAL"
        ? document.querySelector(
            "#contratoDiaPago"
          ).value
        : null,

    fechaPrimerPago: document.querySelector(
      "#contratoPrimerPago"
    ).value,

    observaciones:
      obtenerValorONull(
        "#contratoObservaciones"
      ),

    firmaCliente: firma.obtenerImagen(),

    detalles: [
      {
        idProducto,
        cantidad,
        precioUnitario: precio
      }
    ]
  };

  const boton = document.querySelector(
    "#btnGenerarContrato"
  );

  boton.disabled = true;
  boton.textContent = "Generando contrato...";

  try {
    const venta = await apiFetch(
      "/ventas",
      {
        method: "POST",
        body: JSON.stringify(solicitud)
      }
    );

    localStorage.removeItem(
      "controlventas_cliente_contrato"
    );

    localStorage.removeItem(
      "controlventas_producto_contrato"
    );

    mostrarContratoGenerado(
      venta,
      volverAlInicio
    );

  } catch (error) {
    mostrarErrorMensaje(
      mensaje,
      error.message
    );

    boton.disabled = false;
    boton.textContent = "Generar contrato";
  }
}

function prepararFirma() {
  const canvas = document.querySelector(
    "#lienzoFirma"
  );

  const contexto = canvas.getContext("2d");

  let dibujando = false;
  let firmo = false;

  contexto.fillStyle = "#ffffff";
  contexto.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  contexto.strokeStyle = "#17233b";
  contexto.lineWidth = 5;
  contexto.lineCap = "round";
  contexto.lineJoin = "round";

  function obtenerPosicion(evento) {
    const rectangulo =
      canvas.getBoundingClientRect();

    return {
      x:
        (evento.clientX - rectangulo.left) *
        (canvas.width / rectangulo.width),

      y:
        (evento.clientY - rectangulo.top) *
        (canvas.height / rectangulo.height)
    };
  }

  canvas.addEventListener(
    "pointerdown",
    (evento) => {
      dibujando = true;
      firmo = true;

      canvas.setPointerCapture(
        evento.pointerId
      );

      const posicion = obtenerPosicion(evento);

      contexto.beginPath();
      contexto.moveTo(
        posicion.x,
        posicion.y
      );
    }
  );

  canvas.addEventListener(
    "pointermove",
    (evento) => {
      if (!dibujando) {
        return;
      }

      evento.preventDefault();

      const posicion = obtenerPosicion(evento);

      contexto.lineTo(
        posicion.x,
        posicion.y
      );

      contexto.stroke();
    }
  );

  function terminarFirma() {
    dibujando = false;
    contexto.closePath();
  }

  canvas.addEventListener(
    "pointerup",
    terminarFirma
  );

  canvas.addEventListener(
    "pointercancel",
    terminarFirma
  );

  document
    .querySelector("#btnLimpiarFirma")
    .addEventListener("click", () => {
      contexto.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      contexto.fillStyle = "#ffffff";

      contexto.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      firmo = false;
    });

  return {
    estaFirmado() {
      return firmo;
    },

    obtenerImagen() {
      return canvas.toDataURL("image/png");
    }
  };
}

function mostrarContratoGenerado(
  venta,
  volverAlInicio
) {
  document.querySelector(
    "#contenidoContrato"
  ).innerHTML = `
    <div class="contrato-generado">

      <div class="icono-contrato-generado">
        ✓
      </div>

      <span>CONTRATO GENERADO</span>

      <h2>
        ${escaparTexto(venta.numeroContrato)}
      </h2>

      <p>
        La venta, firma y cuotas fueron
        guardadas correctamente.
      </p>

      <div class="resumen-contrato-generado">

        <div>
          <span>Total</span>
          <strong>
            ${formatearDinero(
              venta.totalVenta
            )}
          </strong>
        </div>

        <div>
          <span>Inicial</span>
          <strong>
            ${formatearDinero(
              venta.cuotaInicial
            )}
          </strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong>
            ${formatearDinero(
              venta.saldoPendiente
            )}
          </strong>
        </div>

      </div>

      <button
        type="button"
        id="btnFinalizarContrato"
        class="btn-guardar-formulario"
      >
        Volver al inicio
      </button>

    </div>
  `;

  document
    .querySelector("#btnFinalizarContrato")
    .addEventListener(
      "click",
      volverAlInicio
    );
}

function mostrarErrorContrato(mensaje) {
  document.querySelector(
    "#contenidoContrato"
  ).innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se puede crear el contrato</h2>
      <p>${escaparTexto(mensaje)}</p>
    </div>
  `;
}

function mostrarErrorMensaje(
  elemento,
  mensaje
) {
  elemento.textContent = mensaje;
  elemento.classList.add("error");
}

function obtenerStockEsperado(detalle) {
  return Number(
    detalle.stockEsperado ??
    (
      Number(detalle.cantidadCargada || 0) -
      Number(detalle.cantidadVendida || 0)
    )
  );
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

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
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

function obtenerValorONull(selector) {
  const valor = document
    .querySelector(selector)
    .value
    .trim();

  return valor || null;
}

function leerLocalStorage(clave) {
  try {
    return JSON.parse(
      localStorage.getItem(clave)
    );
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