import { apiFetch } from "./api.js";

export async function mostrarSalidas(usuario, volverAlInicio) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverSalidas"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Salidas</h1>
            <p>Mercadería del carro</p>
          </div>

          <button
            type="button"
            id="btnNuevaSalida"
            class="btn-agregar-cabecera"
          >
            + Nueva
          </button>
        </div>
      </header>

      <section class="contenido-salidas">

        <div id="listaSalidas">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando salidas...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverSalidas")
    .addEventListener("click", volverAlInicio);

  document.querySelector("#btnNuevaSalida").addEventListener("click", () => {
    mostrarFormularioSalida(usuario, () =>
      mostrarSalidas(usuario, volverAlInicio),
    );
  });

  try {
    const salidas = await apiFetch("/salidas");

    const salidasAbiertas = salidas.filter(
      (salida) => salida.estado === "ABIERTA",
    );

    renderizarSalidas(salidasAbiertas);

    activarBotonesSalidas(salidasAbiertas, usuario, volverAlInicio);

    const salidaAbierta =
      salidasAbiertas.length > 0 ? salidasAbiertas[0] : null;

    if (salidaAbierta) {
      const botonNueva = document.querySelector("#btnNuevaSalida");

      botonNueva.disabled = true;
      botonNueva.textContent = "Salida abierta";

      localStorage.setItem(
        "controlventas_salida_abierta",
        JSON.stringify(salidaAbierta),
      );
    }
  } catch (error) {
    document.querySelector("#listaSalidas").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar las salidas</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarSalidas(salidas) {
  const lista = document.querySelector("#listaSalidas");

  if (salidas.length === 0) {
    lista.innerHTML = `
      <div class="salidas-vacio">
        <div>🚚</div>
        <h2>No existen salidas</h2>
        <p>
          Presiona “Nueva” para registrar
          la mercadería que llevarán en el carro.
        </p>
      </div>
    `;

    return;
  }

  const salidasOrdenadas = [...salidas].sort(
    (salidaA, salidaB) => Number(salidaB.idSalida) - Number(salidaA.idSalida),
  );

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${salidas.length}
      ${salidas.length === 1 ? "salida" : "salidas"}
    </div>

    <div class="lista-salidas">
      ${salidasOrdenadas.map(crearTarjetaSalida).join("")}
    </div>

    <p
      id="mensajeSalida"
      class="aviso-accion"
    ></p>
  `;
}

function crearTarjetaSalida(salida) {
  const detalles = salida.detalles || [];

  const totalCargado = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidadCargada || 0),
    0,
  );

  const totalVendido = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidadVendida || 0),
    0,
  );

  const estado = salida.estado || "ABIERTA";

  return `
    <article class="tarjeta-salida">

      <div class="salida-encabezado">

        <div class="salida-icono">
          🚚
        </div>

        <div class="salida-titulo">
          <span>
            SALIDA N.º ${salida.idSalida}
          </span>

          <h2>
            ${escaparTexto(salida.destino)}
          </h2>

          <p>
            ${formatearFecha(salida.fechaSalida)}
          </p>
        </div>

        <span class="estado-salida ${estado.toLowerCase()}">
          ${estado}
        </span>

      </div>

      <div class="resumen-salida">

        <div>
          <span>Productos</span>
          <strong>${detalles.length}</strong>
        </div>

        <div>
          <span>Cargados</span>
          <strong>${totalCargado}</strong>
        </div>

        <div>
          <span>Vendidos</span>
          <strong>${totalVendido}</strong>
        </div>

      </div>

      ${
        detalles.length > 0
          ? `
            <details class="productos-salida">
              <summary>
                Ver mercadería cargada
              </summary>

              <div>
                ${detalles
                  .map((detalle) =>
                    crearDetalleSalida(detalle, salida.idSalida),
                  )
                  .join("")}
              </div>
            </details>
          `
          : ""
      }

      ${
        estado === "ABIERTA"
          ? `
            <div class="acciones-salida-abierta">

              <button
                type="button"
                class="btn-cerrar-salida"
                data-cerrar-salida="${salida.idSalida}"
              >
                📋 Contar y finalizar ruta
              </button>

            </div>
          `
          : ""
      }

    </article>
  `;
}
function crearDetalleSalida(detalle, idSalida) {
  const producto = detalle.producto || {};

  const cantidadCargada = Number(detalle.cantidadCargada || 0);

  const cantidadVendida = Number(detalle.cantidadVendida || 0);

  const esperado = Number(
    detalle.stockEsperado ?? cantidadCargada - cantidadVendida,
  );

  return `
    <div class="detalle-producto-salida">

      <div>
        <strong>
          ${escaparTexto(producto.nombre || "Producto")}
        </strong>

        <span>
          ${escaparTexto(producto.codigo || "")}
        </span>
      </div>

      <div>
        <span>Cargado</span>
        <b>${cantidadCargada}</b>
      </div>

      <div>
        <span>Vendido</span>
        <b>${cantidadVendida}</b>
      </div>

      <div>
        <span>Queda</span>
        <b>${esperado}</b>
      </div>

      <div class="acciones-detalle-salida">

        <button
          type="button"
          class="btn-ajustar-carga"
          data-ajustar-producto="${producto.idProducto}"
          data-id-salida="${idSalida}"
        >
          Ajustar cantidad
        </button>

        ${
          cantidadVendida === 0
            ? `
            <button
              type="button"
              class="btn-retirar-carga"
              data-retirar-producto="${producto.idProducto}"
              data-id-salida="${idSalida}"
            >
              Retirar del carro
            </button>
          `
            : ""
        }

      </div>

    </div>
  `;
}

function activarBotonesSalidas(salidas, usuario, volverAlInicio) {
  document.querySelectorAll("[data-ajustar-producto]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idSalida = Number(boton.dataset.idSalida);

      const idProducto = Number(boton.dataset.ajustarProducto);

      const salida = salidas.find((item) => Number(item.idSalida) === idSalida);

      const detalle = (salida?.detalles || []).find(
        (item) => Number(item.producto?.idProducto) === idProducto,
      );

      if (!salida || !detalle) {
        return;
      }

      mostrarFormularioAjustarCantidad(salida, detalle, () =>
        mostrarSalidas(usuario, volverAlInicio),
      );
    });
  });

  document.querySelectorAll("[data-retirar-producto]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const idSalida = Number(boton.dataset.idSalida);

      const idProducto = Number(boton.dataset.retirarProducto);

      const salida = salidas.find((item) => Number(item.idSalida) === idSalida);

      const detalle = (salida?.detalles || []).find(
        (item) => Number(item.producto?.idProducto) === idProducto,
      );

      if (!salida || !detalle) {
        return;
      }

      await retirarProductoDelCarro(
        salida,
        detalle,
        boton,
        usuario,
        volverAlInicio,
      );
    });
  });

  document.querySelectorAll("[data-cerrar-salida]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idSalida = Number(boton.dataset.cerrarSalida);

      const salida = salidas.find((item) => Number(item.idSalida) === idSalida);

      if (!salida) {
        return;
      }

      mostrarFormularioCerrarSalida(salida, () =>
        mostrarSalidas(usuario, volverAlInicio),
      );
    });
  });
}

function mostrarFormularioCerrarSalida(salida, volverASalidas) {
  const detalles = salida.detalles || [];

  const totalCargado = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidadCargada || 0),
    0,
  );

  const totalVendido = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidadVendida || 0),
    0,
  );

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverCerrarSalida"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Finalizar ruta</h1>
          <p>Conteo de mercadería</p>
        </div>
      </header>

      <section class="contenido-formulario">

        <form
          id="formCerrarSalida"
          class="formulario-movil"
        >

          <article class="aviso-conteo-salida">
            <div>📋</div>

            <section>
              <h2>Cuenta lo que regresó</h2>

              <p>
                Escribe la cantidad real que
                volvió en el carro.
              </p>
            </section>
          </article>

          <article class="resumen-ruta-cierre">
            <span>SALIDA N.º ${salida.idSalida}</span>

            <h2>
              ${escaparTexto(salida.destino)}
            </h2>

            <p>
              ${formatearFecha(salida.fechaSalida)}
              · Cargadas: ${totalCargado}
              · Vendidas: ${totalVendido}
            </p>
          </article>

          <div class="lista-conteo-salida">
            ${
              detalles.length > 0
                ? detalles.map(crearTarjetaConteoSalida).join("")
                : `
                <div class="error-lista-simple">
                  Esta salida no tiene mercadería cargada.
                </div>
              `
            }
          </div>

          <article class="resumen-final-salida">
            <div>
              <span>Vendidas</span>
              <strong id="totalVendidoCierre">
                ${totalVendido}
              </strong>
            </div>

            <div>
              <span>Esperadas</span>
              <strong id="totalEsperadoCierre">0</strong>
            </div>

            <div>
              <span>Contadas</span>
              <strong id="totalContadoCierre">0</strong>
            </div>

            <div class="diferencia">
              <span>Diferencia</span>
              <strong id="totalDiferenciaCierre">0</strong>
            </div>
          </article>

          <p class="ayuda-devolucion-almacen">
            Las unidades contadas regresarán al
            stock del almacén.
          </p>

          <p
            id="mensajeCerrarSalida"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnConfirmarCierreSalida"
            class="btn-confirmar-cierre-salida"
          >
            🏠 Cerrar salida y devolver al almacén
          </button>

        </form>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverCerrarSalida")
    .addEventListener("click", volverASalidas);

  document.querySelectorAll("[data-conteo-producto]").forEach((input) => {
    input.addEventListener("input", () => {
      actualizarEstadoConteo(input);
      actualizarResumenCierre();
    });

    actualizarEstadoConteo(input);
  });

  actualizarResumenCierre();

  document
    .querySelector("#formCerrarSalida")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await guardarCierreSalida(salida, volverASalidas);
    });
}

function crearTarjetaConteoSalida(detalle) {
  const producto = detalle.producto || {};

  const cantidadCargada = Number(detalle.cantidadCargada || 0);

  const cantidadVendida = Number(detalle.cantidadVendida || 0);

  const cantidadEsperada = Math.max(
    Number(detalle.stockEsperado ?? cantidadCargada - cantidadVendida),
    0,
  );

  return `
    <article
      class="tarjeta-conteo-salida"
      data-tarjeta-conteo="${producto.idProducto}"
    >
      <span class="codigo-producto-conteo">
        ${escaparTexto(producto.codigo || "")}
      </span>

      <h2>
        ${escaparTexto(producto.nombre || "Producto")}
      </h2>

      <div class="cantidades-conteo-salida">
        <div>
          <span>Cargadas</span>
          <strong>${cantidadCargada}</strong>
        </div>

        <div>
          <span>Vendidas</span>
          <strong>${cantidadVendida}</strong>
        </div>

        <div>
          <span>Deben regresar</span>
          <strong>${cantidadEsperada}</strong>
        </div>
      </div>

      <div class="campo-conteo-producto">
        <label>
          Cantidad contada

          <input
            type="number"
            min="0"
            step="1"
            value="${cantidadEsperada}"
            data-conteo-producto="${producto.idProducto}"
            data-esperado="${cantidadEsperada}"
            required
          >
        </label>

        <span
          class="estado-conteo sin-diferencia"
          data-estado-conteo
        >
          Sin diferencia
        </span>
      </div>
    </article>
  `;
}

function actualizarEstadoConteo(input) {
  const tarjeta = input.closest(".tarjeta-conteo-salida");

  const estado = tarjeta?.querySelector("[data-estado-conteo]");

  if (!estado) {
    return;
  }

  const esperado = Number(input.dataset.esperado || 0);

  const contado = Number(input.value || 0);
  const diferencia = contado - esperado;

  estado.classList.remove("sin-diferencia", "faltante", "sobrante");

  if (diferencia === 0) {
    estado.textContent = "Sin diferencia";
    estado.classList.add("sin-diferencia");
  } else if (diferencia < 0) {
    estado.textContent = `Faltan ${Math.abs(diferencia)}`;

    estado.classList.add("faltante");
  } else {
    estado.textContent = `Sobran ${diferencia}`;

    estado.classList.add("sobrante");
  }
}

function actualizarResumenCierre() {
  const inputs = [...document.querySelectorAll("[data-conteo-producto]")];

  const esperado = inputs.reduce(
    (total, input) => total + Number(input.dataset.esperado || 0),
    0,
  );

  const contado = inputs.reduce(
    (total, input) => total + Number(input.value || 0),
    0,
  );

  const diferencia = contado - esperado;

  const totalEsperado = document.querySelector("#totalEsperadoCierre");

  const totalContado = document.querySelector("#totalContadoCierre");

  const totalDiferencia = document.querySelector("#totalDiferenciaCierre");

  if (totalEsperado) {
    totalEsperado.textContent = esperado;
  }

  if (totalContado) {
    totalContado.textContent = contado;
  }

  if (totalDiferencia) {
    totalDiferencia.textContent = diferencia;

    totalDiferencia.classList.toggle("con-diferencia", diferencia !== 0);
  }
}

async function guardarCierreSalida(salida, volverASalidas) {
  const mensaje = document.querySelector("#mensajeCerrarSalida");

  const boton = document.querySelector("#btnConfirmarCierreSalida");

  const conteos = [...document.querySelectorAll("[data-conteo-producto]")].map(
    (input) => ({
      idProducto: Number(input.dataset.conteoProducto),

      cantidadContada: Number(input.value),

      cantidadEsperada: Number(input.dataset.esperado || 0),
    }),
  );

  const conteoInvalido = conteos.some(
    (conteo) =>
      !Number.isInteger(conteo.cantidadContada) || conteo.cantidadContada < 0,
  );

  if (conteoInvalido) {
    mensaje.textContent =
      "Las cantidades contadas deben ser " + "números enteros desde cero.";

    mensaje.classList.add("error");
    return;
  }

  const existeDiferencia = conteos.some(
    (conteo) => conteo.cantidadContada !== conteo.cantidadEsperada,
  );

  if (existeDiferencia) {
    const confirmado = window.confirm(
      "Existen diferencias en el conteo. " +
        "¿Deseas cerrar la salida con las " +
        "cantidades registradas?",
    );

    if (!confirmado) {
      return;
    }
  }

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Cerrando salida...";

  try {
    const salidaCerrada = await apiFetch(`/salidas/${salida.idSalida}/cerrar`, {
      method: "PUT",

      body: JSON.stringify({
        conteos: conteos.map((conteo) => ({
          idProducto: conteo.idProducto,
          cantidadContada: conteo.cantidadContada,

          observaciones:
            conteo.cantidadContada === conteo.cantidadEsperada
              ? null
              : `Conteo automático: se esperaban ${
                  conteo.cantidadEsperada
                } y se contaron ${conteo.cantidadContada}.`,
        })),
      }),
    });

    localStorage.removeItem("controlventas_salida_abierta");

    const totalDevuelto = conteos.reduce(
      (total, conteo) => total + conteo.cantidadContada,
      0,
    );

    document.querySelector(".contenido-formulario").innerHTML = `
      <div class="registro-exitoso">
        <div>✓</div>

        <h2>Salida finalizada</h2>

        <p>
          La ruta fue cerrada y la mercadería
          contada regresó al almacén.
        </p>

        <strong>
          ${totalDevuelto} unidades devueltas
        </strong>

        ${
          salidaCerrada?.idSalida
            ? `
            <span>
              SALIDA N.º ${salidaCerrada.idSalida}
            </span>
          `
            : ""
        }

        <button
          type="button"
          id="btnVolverSalidasCerradas"
          class="btn-guardar-formulario"
        >
          Volver a salidas
        </button>
      </div>
    `;

    document
      .querySelector("#btnVolverSalidasCerradas")
      .addEventListener("click", volverASalidas);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");

    boton.disabled = false;
    boton.textContent = "🏠 Cerrar salida y devolver al almacén";
  }
}

function mostrarFormularioAjustarCantidad(salida, detalle, volverASalidas) {
  const producto = detalle.producto || {};

  const cantidadCargada = Number(detalle.cantidadCargada || 0);

  const cantidadVendida = Number(detalle.cantidadVendida || 0);

  const cantidadMinima = Math.max(cantidadVendida, 1);

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverAjusteCarga"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Ajustar cantidad</h1>

          <p>
            Salida N.º ${salida.idSalida}
          </p>
        </div>
      </header>

      <section class="contenido-formulario">

        <form
          id="formAjustarCantidad"
          class="formulario-movil"
        >

          <div class="grupo-formulario">

            <h2>
              ${escaparTexto(producto.nombre)}
            </h2>

            <div class="resumen-ajuste-carga">

              <div>
                <span>Cargado actualmente</span>
                <strong>
                  ${cantidadCargada}
                </strong>
              </div>

              <div>
                <span>Ya vendido</span>
                <strong>
                  ${cantidadVendida}
                </strong>
              </div>

            </div>

            <label>
              Nueva cantidad total <b>*</b>

              <input
                type="number"
                id="nuevaCantidadCarga"
                min="${cantidadMinima}"
                step="1"
                value="${cantidadCargada}"
                required
              >
            </label>

            <p class="ayuda-formulario">
              Escribe la cantidad total que
              realmente cargaste al carro.
            </p>

          </div>

          <p
            id="mensajeAjustarCantidad"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnGuardarAjuste"
            class="btn-guardar-formulario"
          >
            Guardar ajuste
          </button>

        </form>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverAjusteCarga")
    .addEventListener("click", volverASalidas);

  document
    .querySelector("#formAjustarCantidad")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await guardarAjusteCantidad(salida, detalle, volverASalidas);
    });
}

async function guardarAjusteCantidad(salida, detalle, volverASalidas) {
  const mensaje = document.querySelector("#mensajeAjustarCantidad");

  const boton = document.querySelector("#btnGuardarAjuste");

  const nuevaCantidad = Number(
    document.querySelector("#nuevaCantidadCarga").value,
  );

  const cantidadActual = Number(detalle.cantidadCargada || 0);

  const cantidadVendida = Number(detalle.cantidadVendida || 0);

  if (!Number.isInteger(nuevaCantidad) || nuevaCantidad <= 0) {
    mensaje.textContent =
      "La cantidad debe ser un número entero mayor que cero.";

    mensaje.classList.add("error");
    return;
  }

  if (nuevaCantidad < cantidadVendida) {
    mensaje.textContent = "La cantidad no puede ser menor que lo ya vendido.";

    mensaje.classList.add("error");
    return;
  }

  if (nuevaCantidad === cantidadActual) {
    mensaje.textContent = "La cantidad no ha cambiado.";

    mensaje.classList.add("error");
    return;
  }

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const salidaActualizada = await apiFetch(
      `/salidas/${salida.idSalida}` +
        `/productos/${detalle.producto.idProducto}`,
      {
        method: "PUT",

        body: JSON.stringify({
          cantidad: nuevaCantidad,
        }),
      },
    );

    localStorage.setItem(
      "controlventas_salida_abierta",
      JSON.stringify(salidaActualizada),
    );

    document.querySelector(".contenido-formulario").innerHTML = `
      <div class="registro-exitoso">

        <div>✓</div>

        <h2>Cantidad corregida</h2>

        <p>
          La carga fue actualizada correctamente.
        </p>

        <strong>
          Antes: ${cantidadActual}
          · Ahora: ${nuevaCantidad}
        </strong>

        <button
          type="button"
          id="btnVerSalidaAjustada"
          class="btn-guardar-formulario"
        >
          Ver salida
        </button>

      </div>
    `;

    document
      .querySelector("#btnVerSalidaAjustada")
      .addEventListener("click", volverASalidas);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");

    boton.disabled = false;
    boton.textContent = "Guardar ajuste";
  }
}

async function retirarProductoDelCarro(
  salida,
  detalle,
  boton,
  usuario,
  volverAlInicio,
) {
  const producto = detalle.producto || {};

  const cantidadVendida = Number(detalle.cantidadVendida || 0);

  if (cantidadVendida > 0) {
    const mensaje = document.querySelector("#mensajeSalida");

    if (mensaje) {
      mensaje.textContent =
        "No puedes retirar completamente un " + "producto que ya tiene ventas.";
    }

    return;
  }

  const confirmado = window.confirm(
    `¿Retirar ${detalle.cantidadCargada} ` +
      `unidades de ${producto.nombre} del carro? ` +
      "La cantidad regresará al almacén.",
  );

  if (!confirmado) {
    return;
  }

  boton.disabled = true;
  boton.textContent = "Retirando...";

  try {
    const salidaActualizada = await apiFetch(
      `/salidas/${salida.idSalida}` + `/productos/${producto.idProducto}`,
      {
        method: "DELETE",
      },
    );

    localStorage.setItem(
      "controlventas_salida_abierta",
      JSON.stringify(salidaActualizada),
    );

    await mostrarSalidas(usuario, volverAlInicio);
  } catch (error) {
    const mensaje = document.querySelector("#mensajeSalida");

    if (mensaje) {
      mensaje.textContent = error.message;
    }

    boton.disabled = false;
    boton.textContent = "Retirar del carro";
  }
}

async function mostrarFormularioAgregarMercaderia(salida, volverASalidas) {
  document.querySelector("#app").innerHTML = `
        <main class="aplicacion-movil">

            <header class="cabecera-pagina">
                <button
                    type="button"
                    id="btnVolverAgregarMercaderia"
                    class="btn-volver"
                >
                    ‹
                </button>

                <div>
                    <h1>Agregar mercadería</h1>
                    <p>
                        Salida N.º ${salida.idSalida}
                        · ${escaparTexto(salida.destino)}
                    </p>
                </div>
            </header>

            <section class="contenido-formulario">

                <form
                    id="formAgregarMercaderia"
                    class="formulario-movil"
                >
                    <div class="grupo-formulario">
                        <h2>Todo está seleccionado</h2>

                        <p class="ayuda-formulario">
                            Usaremos la cantidad máxima
                            disponible. Quita solamente lo
                            que no llevarás.
                        </p>

                        <div id="productosParaSalida">
                            <div class="estado-cargando">
                                <div class="cargador"></div>
                                <p>Cargando productos...</p>
                            </div>
                        </div>
                    </div>

                    <p
                        id="mensajeAgregarMercaderia"
                        class="mensaje-formulario"
                    ></p>

                    <button
                        type="submit"
                        id="btnGuardarMercaderia"
                        class="btn-guardar-formulario"
                    >
                        Confirmar y cargar al carro
                    </button>
                </form>

            </section>

        </main>
    `;

  document
    .querySelector("#btnVolverAgregarMercaderia")
    .addEventListener("click", volverASalidas);

  try {
    const productos = await apiFetch("/productos/activos");

    renderizarProductosParaSalida(productos);

    document
      .querySelector("#formAgregarMercaderia")
      .addEventListener("submit", async (evento) => {
        evento.preventDefault();

        await guardarMercaderiaEnSalida(salida, productos, volverASalidas);
      });
  } catch (error) {
    document.querySelector("#productosParaSalida").innerHTML = `
            <div class="error-lista-simple">
                ${escaparTexto(error.message)}
            </div>
        `;
  }
}

async function guardarMercaderiaEnSalida(salida, productos, volverASalidas) {
  const mensaje = document.querySelector("#mensajeAgregarMercaderia");

  const detalles = [];

  document.querySelectorAll("[data-cantidad-producto]").forEach((input) => {
    const cantidad = Number(input.value);

    if (cantidad > 0) {
      detalles.push({
        idProducto: Number(input.dataset.cantidadProducto),
        cantidad,
      });
    }
  });

  if (detalles.length === 0) {
    mensaje.textContent = "Debes seleccionar al menos un producto.";

    mensaje.classList.add("error");
    return;
  }

  for (const detalle of detalles) {
    const producto = productos.find(
      (item) => item.idProducto === detalle.idProducto,
    );

    if (detalle.cantidad > Number(producto.stockAlmacen)) {
      mensaje.textContent = `Stock insuficiente para ${producto.nombre}.`;

      mensaje.classList.add("error");
      return;
    }
  }

  const boton = document.querySelector("#btnGuardarMercaderia");

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Agregando...";

  try {
    let salidaActualizada = salida;

    for (const detalle of detalles) {
      salidaActualizada = await apiFetch(
        `/salidas/${salida.idSalida}/productos`,
        {
          method: "POST",
          body: JSON.stringify(detalle),
        },
      );
    }

    localStorage.setItem(
      "controlventas_salida_abierta",
      JSON.stringify(salidaActualizada),
    );

    document.querySelector(".contenido-formulario").innerHTML = `
            <div class="registro-exitoso">
                <div>✓</div>

                <h2>Mercadería agregada</h2>

                <p>
                    Los productos fueron cargados
                    correctamente al carro.
                </p>

                <button
                    type="button"
                    id="btnVolverSalidaActualizada"
                    class="btn-guardar-formulario"
                >
                    Ver salida
                </button>
            </div>
        `;

    document
      .querySelector("#btnVolverSalidaActualizada")
      .addEventListener("click", volverASalidas);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");

    boton.disabled = false;
    boton.textContent = "Confirmar y cargar al carro";
  }
}

export async function mostrarFormularioSalida(usuario, volverASalidas) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverFormularioSalida"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Nueva salida</h1>
          <p>Cargar mercadería al carro</p>
        </div>
      </header>

      <section class="contenido-formulario">

        <form
          id="formNuevaSalida"
          class="formulario-movil"
        >

          <div class="grupo-formulario">
            <h2>Datos de la ruta</h2>

            <label>
              Fecha de salida

              <input
                type="date"
                id="salidaFecha"
                required
              >
            </label>

            <label>
              Destino

              <input
                type="text"
                id="salidaDestino"
                placeholder="Tablada - VMT - Pamplona"
                required
              >
            </label>

          </div>

          <div class="grupo-formulario">
            <h2>Mercadería para el carro</h2>

            <p class="ayuda-formulario">
              Todo aparece seleccionado con el
              stock máximo. Quita solamente los
              productos que no llevarán.
            </p>

            <div id="productosParaSalida">
              <div class="estado-cargando">
                <div class="cargador"></div>
                <p>Cargando productos...</p>
              </div>
            </div>
          </div>

          <p
            id="mensajeFormularioSalida"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnGuardarSalida"
            class="btn-guardar-formulario"
          >
            Abrir salida y cargar todo
          </button>

        </form>

      </section>

    </main>
  `;

  document.querySelector("#salidaFecha").value = obtenerFechaActual();

  document
    .querySelector("#btnVolverFormularioSalida")
    .addEventListener("click", volverASalidas);

  try {
    const productos = await apiFetch("/productos/activos");

    renderizarProductosParaSalida(productos);

    document
      .querySelector("#formNuevaSalida")
      .addEventListener("submit", async (evento) => {
        evento.preventDefault();

        await guardarSalida(productos, usuario, volverASalidas);
      });
  } catch (error) {
    document.querySelector("#productosParaSalida").innerHTML = `
      <div class="error-lista-simple">
        ${escaparTexto(error.message)}
      </div>
    `;
  }
}

function renderizarProductosParaSalida(productos) {
  const contenedor = document.querySelector("#productosParaSalida");

  const disponibles = productos.filter(
    (producto) => Number(producto.stockAlmacen) > 0,
  );

  if (disponibles.length === 0) {
    contenedor.innerHTML = `
      <div class="error-lista-simple">
        No hay productos con stock disponible.
      </div>
    `;

    return;
  }

  contenedor.innerHTML = `
    <div class="resumen-carga-automatica">
      <div>
        <span>Productos seleccionados</span>
        <strong id="cantidadProductosCarga">0</strong>
      </div>

      <div>
        <span>Unidades para el carro</span>
        <strong id="cantidadUnidadesCarga">0</strong>
      </div>
    </div>

    <div class="lista-carga-productos">
      ${disponibles
        .map(
          (producto) => `
          <article
            class="producto-para-salida"
            data-tarjeta-producto-carga="${producto.idProducto}"
          >

            <div>
              <strong>
                ${escaparTexto(producto.nombre)}
              </strong>

              <span>
                ${escaparTexto(producto.codigo)}
                · Disponible:
                ${producto.stockAlmacen}
              </span>
            </div>

            <div class="controles-producto-carga">
              <input
                type="number"
                min="0"
                max="${producto.stockAlmacen}"
                step="1"
                value="${producto.stockAlmacen}"
                data-cantidad-producto="${producto.idProducto}"
                data-stock-maximo="${producto.stockAlmacen}"
              >

              <button
                type="button"
                class="btn-quitar-producto-carga"
                data-quitar-producto-carga="${producto.idProducto}"
              >
                Quitar
              </button>
            </div>

          </article>
        `,
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll("[data-cantidad-producto]").forEach((input) => {
    input.addEventListener("input", () => {
      normalizarCantidadCarga(input);
      actualizarTarjetaCarga(input);
      actualizarResumenCarga();
    });

    actualizarTarjetaCarga(input);
  });

  document.querySelectorAll("[data-quitar-producto-carga]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idProducto = Number(boton.dataset.quitarProductoCarga);

      const input = document.querySelector(
        `[data-cantidad-producto="${idProducto}"]`,
      );

      if (!input) {
        return;
      }

      const cantidadActual = Number(input.value || 0);

      input.value = cantidadActual > 0 ? 0 : input.dataset.stockMaximo;

      actualizarTarjetaCarga(input);
      actualizarResumenCarga();
    });
  });

  actualizarResumenCarga();
}

function normalizarCantidadCarga(input) {
  const maximo = Number(input.dataset.stockMaximo || 0);

  let cantidad = Number(input.value || 0);

  if (!Number.isFinite(cantidad)) {
    cantidad = 0;
  }

  cantidad = Math.trunc(cantidad);
  cantidad = Math.max(0, cantidad);
  cantidad = Math.min(maximo, cantidad);

  input.value = cantidad;
}

function actualizarTarjetaCarga(input) {
  const idProducto = Number(input.dataset.cantidadProducto);

  const tarjeta = document.querySelector(
    `[data-tarjeta-producto-carga="${idProducto}"]`,
  );

  const boton = document.querySelector(
    `[data-quitar-producto-carga="${idProducto}"]`,
  );

  const seleccionado = Number(input.value) > 0;

  tarjeta?.classList.toggle("producto-carga-excluido", !seleccionado);

  if (boton) {
    boton.textContent = seleccionado ? "Quitar" : "Agregar";

    boton.classList.toggle("agregar", !seleccionado);
  }
}

function actualizarResumenCarga() {
  const cantidades = [
    ...document.querySelectorAll("[data-cantidad-producto]"),
  ].map((input) => Number(input.value || 0));

  const productosSeleccionados = cantidades.filter(
    (cantidad) => cantidad > 0,
  ).length;

  const unidadesSeleccionadas = cantidades.reduce(
    (total, cantidad) => total + cantidad,
    0,
  );

  const totalProductos = document.querySelector("#cantidadProductosCarga");

  const totalUnidades = document.querySelector("#cantidadUnidadesCarga");

  if (totalProductos) {
    totalProductos.textContent = productosSeleccionados;
  }

  if (totalUnidades) {
    totalUnidades.textContent = unidadesSeleccionadas;
  }
}

async function guardarSalida(productos, usuario, volverASalidas) {
  const mensaje = document.querySelector("#mensajeFormularioSalida");

  const detalles = [];

  document.querySelectorAll("[data-cantidad-producto]").forEach((input) => {
    const cantidad = Number(input.value);

    if (cantidad > 0) {
      detalles.push({
        idProducto: Number(input.dataset.cantidadProducto),
        cantidad,
      });
    }
  });

  if (detalles.length === 0) {
    mensaje.textContent = "Debes agregar al menos un producto al carro.";

    mensaje.classList.add("error");
    return;
  }

  for (const detalle of detalles) {
    const producto = productos.find(
      (item) => item.idProducto === detalle.idProducto,
    );

    if (detalle.cantidad > Number(producto.stockAlmacen)) {
      mensaje.textContent = `Stock insuficiente para ${producto.nombre}.`;

      mensaje.classList.add("error");
      return;
    }
  }

  const nuevaSalida = {
    fechaSalida: obtenerValor("#salidaFecha"),

    destino: obtenerValor("#salidaDestino"),

    vendedor: usuario?.nombreCompleto?.trim() || "Administrador",

    observaciones: null,

    detalles,
  };

  const boton = document.querySelector("#btnGuardarSalida");

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Abriendo salida...";

  try {
    const salidaGuardada = await apiFetch("/salidas", {
      method: "POST",
      body: JSON.stringify(nuevaSalida),
    });

    localStorage.setItem(
      "controlventas_salida_abierta",
      JSON.stringify(salidaGuardada),
    );

    document.querySelector(".contenido-formulario").innerHTML = `
      <div class="registro-exitoso">
        <div>✓</div>

        <h2>Salida abierta</h2>

        <p>
          La mercadería fue descontada
          del almacén y cargada al carro.
        </p>

        <strong>
          SALIDA N.º ${salidaGuardada.idSalida}
        </strong>

        <button
          type="button"
          id="btnVolverListaSalidas"
          class="btn-guardar-formulario"
        >
          Ver salida
        </button>
      </div>
    `;

    document
      .querySelector("#btnVolverListaSalidas")
      .addEventListener("click", volverASalidas);
  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");

    boton.disabled = false;
    boton.textContent = "Abrir salida y cargar todo";
  }
}

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();

  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha";
  }

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE");
}

function obtenerValor(selector) {
  return document.querySelector(selector).value.trim();
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
