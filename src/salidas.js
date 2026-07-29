import { apiFetch } from "./api.js";

export async function mostrarSalidas(
    usuario,
    volverAlInicio
) {
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

    document
        .querySelector("#btnNuevaSalida")
        .addEventListener("click", () => {
            mostrarFormularioSalida(
                usuario,
                () => mostrarSalidas(
                    usuario,
                    volverAlInicio
                )
            );
        });

    try {
        const salidas = await apiFetch("/salidas");

        renderizarSalidas(salidas);
        activarBotonesSalidas(salidas);

        const salidaAbierta = salidas.find(
            (salida) => salida.estado === "ABIERTA"
        );

        if (salidaAbierta) {
            const botonNueva = document.querySelector(
                "#btnNuevaSalida"
            );

            botonNueva.disabled = true;
            botonNueva.textContent = "Salida abierta";

            localStorage.setItem(
                "controlventas_salida_abierta",
                JSON.stringify(salidaAbierta)
            );
        }

    } catch (error) {
        document.querySelector(
            "#listaSalidas"
        ).innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar las salidas</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
    }
}

function renderizarSalidas(salidas) {
    const lista = document.querySelector(
        "#listaSalidas"
    );

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
        (salidaA, salidaB) =>
            Number(salidaB.idSalida) -
            Number(salidaA.idSalida)
    );

    lista.innerHTML = `
    <div class="cantidad-resultados">
      ${salidas.length}
      ${salidas.length === 1 ? "salida" : "salidas"}
    </div>

    <div class="lista-salidas">
      ${salidasOrdenadas
            .map(crearTarjetaSalida)
            .join("")}
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
        (total, detalle) =>
            total + Number(
                detalle.cantidadCargada || 0
            ),
        0
    );

    const totalVendido = detalles.reduce(
        (total, detalle) =>
            total + Number(
                detalle.cantidadVendida || 0
            ),
        0
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
            ${formatearFecha(
        salida.fechaSalida
    )}
          </p>
        </div>

        <span class="estado-salida ${estado.toLowerCase()
        }">
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

      <div class="datos-salida">
        <p>
          <b>Vendedor:</b>
          ${escaparTexto(salida.vendedor)}
        </p>

        ${salida.observaciones
            ? `
              <p>
                <b>Observaciones:</b>
                ${escaparTexto(
                salida.observaciones
            )}
              </p>
            `
            : ""
        }
      </div>

      ${detalles.length > 0
            ? `
            <details class="productos-salida">
              <summary>
                Ver mercadería cargada
              </summary>

              <div>
                ${detalles
                .map(crearDetalleSalida)
                .join("")}
              </div>
            </details>
          `
            : ""
        }

      ${estado === "ABIERTA"
            ? `
            <div class="acciones-salida-abierta">

    <button
        type="button"
        class="btn-usar-salida"
        data-usar-salida="${salida.idSalida}"
    >
        Usar para registrar contratos
    </button>

    <button
        type="button"
        class="btn-cerrar-salida"
        data-cerrar-salida="${salida.idSalida}"
    >
        Cerrar salida
    </button>

</div>
          `
            : ""
        }

    </article>
  `;
}

function crearDetalleSalida(detalle) {
    const producto = detalle.producto || {};

    const esperado =
        detalle.stockEsperado ??
        (
            Number(detalle.cantidadCargada || 0) -
            Number(detalle.cantidadVendida || 0)
        );

    return `
    <div class="detalle-producto-salida">
      <div>
        <strong>
          ${escaparTexto(
        producto.nombre || "Producto"
    )}
        </strong>

        <span>
          ${escaparTexto(
        producto.codigo || ""
    )}
        </span>
      </div>

      <div>
        <span>Cargado</span>
        <b>${detalle.cantidadCargada}</b>
      </div>

      <div>
        <span>Vendido</span>
        <b>${detalle.cantidadVendida}</b>
      </div>

      <div>
        <span>Queda</span>
        <b>${esperado}</b>
      </div>
    </div>
  `;
}

function activarBotonesSalidas(salidas) {
    document
        .querySelectorAll("[data-usar-salida]")
        .forEach((boton) => {
            boton.addEventListener("click", () => {
                const idSalida = Number(
                    boton.dataset.usarSalida
                );

                const salida = salidas.find(
                    (item) => item.idSalida === idSalida
                );

                localStorage.setItem(
                    "controlventas_salida_abierta",
                    JSON.stringify(salida)
                );

                document.querySelector(
                    "#mensajeSalida"
                ).textContent =
                    `La salida ${idSalida} quedó seleccionada ` +
                    `para registrar contratos.`;
            });
        });
}

async function mostrarFormularioSalida(
    usuario,
    volverASalidas
) {
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
              Fecha de salida <b>*</b>

              <input
                type="date"
                id="salidaFecha"
                required
              >
            </label>

            <label>
              Destino <b>*</b>

              <input
                type="text"
                id="salidaDestino"
                placeholder="Tablada - VMT - Pamplona"
                required
              >
            </label>

            <label>
              Vendedor <b>*</b>

              <input
                type="text"
                id="salidaVendedor"
                value="${escaparTexto(
        usuario.nombreCompleto
    )}"
                required
              >
            </label>

            <label>
              Observaciones

              <textarea
                id="salidaObservaciones"
                rows="3"
                placeholder="Información adicional de la ruta"
              ></textarea>
            </label>
          </div>

          <div class="grupo-formulario">
            <h2>Mercadería para el carro</h2>

            <p class="ayuda-formulario">
              Escribe la cantidad que llevarán.
              Los productos con cantidad 0 no serán agregados.
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
            Abrir salida
          </button>

        </form>

      </section>

    </main>
  `;

    document.querySelector(
        "#salidaFecha"
    ).value = obtenerFechaActual();

    document
        .querySelector(
            "#btnVolverFormularioSalida"
        )
        .addEventListener(
            "click",
            volverASalidas
        );

    try {
        const productos = await apiFetch(
            "/productos/activos"
        );

        renderizarProductosParaSalida(productos);

        document
            .querySelector("#formNuevaSalida")
            .addEventListener(
                "submit",
                async (evento) => {
                    evento.preventDefault();

                    await guardarSalida(
                        productos,
                        volverASalidas
                    );
                }
            );

    } catch (error) {
        document.querySelector(
            "#productosParaSalida"
        ).innerHTML = `
      <div class="error-lista-simple">
        ${escaparTexto(error.message)}
      </div>
    `;
    }
}

function renderizarProductosParaSalida(
    productos
) {
    const contenedor = document.querySelector(
        "#productosParaSalida"
    );

    const disponibles = productos.filter(
        (producto) =>
            Number(producto.stockAlmacen) > 0
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
    <div class="lista-carga-productos">
      ${disponibles
            .map((producto) => `
          <label class="producto-para-salida">

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

            <input
              type="number"
              min="0"
              max="${producto.stockAlmacen}"
              value="0"
              data-cantidad-producto="${producto.idProducto
                }"
            >

          </label>
        `)
            .join("")}
    </div>
  `;
}

async function guardarSalida(
    productos,
    volverASalidas
) {
    const mensaje = document.querySelector(
        "#mensajeFormularioSalida"
    );

    const detalles = [];

    document
        .querySelectorAll(
            "[data-cantidad-producto]"
        )
        .forEach((input) => {
            const cantidad = Number(input.value);

            if (cantidad > 0) {
                detalles.push({
                    idProducto: Number(
                        input.dataset.cantidadProducto
                    ),
                    cantidad
                });
            }
        });

    if (detalles.length === 0) {
        mensaje.textContent =
            "Debes agregar al menos un producto al carro.";

        mensaje.classList.add("error");
        return;
    }

    for (const detalle of detalles) {
        const producto = productos.find(
            (item) =>
                item.idProducto === detalle.idProducto
        );

        if (
            detalle.cantidad >
            Number(producto.stockAlmacen)
        ) {
            mensaje.textContent =
                `Stock insuficiente para ${producto.nombre}.`;

            mensaje.classList.add("error");
            return;
        }
    }

    const nuevaSalida = {
        fechaSalida: obtenerValor(
            "#salidaFecha"
        ),

        destino: obtenerValor(
            "#salidaDestino"
        ),

        vendedor: obtenerValor(
            "#salidaVendedor"
        ),

        observaciones: valorONull(
            "#salidaObservaciones"
        ),

        detalles
    };

    const boton = document.querySelector(
        "#btnGuardarSalida"
    );

    mensaje.textContent = "";
    mensaje.classList.remove("error");

    boton.disabled = true;
    boton.textContent = "Abriendo salida...";

    try {
        const salidaGuardada = await apiFetch(
            "/salidas",
            {
                method: "POST",
                body: JSON.stringify(nuevaSalida)
            }
        );

        localStorage.setItem(
            "controlventas_salida_abierta",
            JSON.stringify(salidaGuardada)
        );

        document.querySelector(
            ".contenido-formulario"
        ).innerHTML = `
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
            .addEventListener(
                "click",
                volverASalidas
            );

    } catch (error) {
        mensaje.textContent = error.message;
        mensaje.classList.add("error");

        boton.disabled = false;
        boton.textContent = "Abrir salida";
    }
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

function obtenerValor(selector) {
    return document
        .querySelector(selector)
        .value
        .trim();
}

function valorONull(selector) {
    const valor = obtenerValor(selector);

    return valor || null;
}

function escaparTexto(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}