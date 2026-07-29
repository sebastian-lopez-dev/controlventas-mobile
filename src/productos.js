import { apiFetch } from "./api.js";

export async function mostrarProductos(
  usuario,
  volverAlInicio
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverProductos"
          class="btn-volver"
        >
          ‹
        </button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Productos</h1>
            <p>Stock del almacén</p>
          </div>

          <button
            type="button"
            id="btnNuevoProducto"
            class="btn-agregar-cabecera"
          >
            + Nuevo
          </button>
        </div>
      </header>

      <section class="contenido-productos">

        <div id="resumenProductos" class="resumen-productos">
          <article>
            <span>Productos activos</span>
            <strong>--</strong>
          </article>

          <article>
            <span>Stock bajo</span>
            <strong>--</strong>
          </article>
        </div>

        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarProducto"
            placeholder="Buscar producto, código o marca"
          >
        </div>

        <div class="filtros-productos">
          <button
            type="button"
            class="filtro-producto activo"
            data-filtro="todos"
          >
            Todos
          </button>

          <button
            type="button"
            class="filtro-producto"
            data-filtro="bajo"
          >
            Stock bajo
          </button>

          <button
            type="button"
            class="filtro-producto"
            data-filtro="agotado"
          >
            Agotados
          </button>
        </div>

        <div id="listaProductos">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando productos...</p>
          </div>
        </div>

      </section>

    </main>
  `;

  document
    .querySelector("#btnVolverProductos")
    .addEventListener("click", volverAlInicio);

  document
    .querySelector("#btnNuevoProducto")
    .addEventListener("click", () => {
      mostrarFormularioProducto(
        usuario,
        () => mostrarProductos(
          usuario,
          volverAlInicio
        )
      );
    });

  try {
    const productos = await apiFetch("/productos");

    renderizarResumenProductos(productos);
    renderizarProductos(productos);
    activarFiltrosProductos();
    activarSeleccionProducto(productos);

  } catch (error) {
    document.querySelector(
      "#listaProductos"
    ).innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los productos</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarResumenProductos(productos) {
  const productosActivos = productos.filter(
    (producto) => producto.activo
  );

  const productosStockBajo = productosActivos.filter(
    (producto) =>
      Number(producto.stockAlmacen) <=
      Number(producto.stockMinimo)
  );

  document.querySelector(
    "#resumenProductos"
  ).innerHTML = `
    <article>
      <span>Productos activos</span>
      <strong>${productosActivos.length}</strong>
    </article>

    <article>
      <span>Stock bajo</span>
      <strong>${productosStockBajo.length}</strong>
    </article>
  `;
}

function renderizarProductos(productos) {
  const lista = document.querySelector(
    "#listaProductos"
  );

  if (productos.length === 0) {
    lista.innerHTML = `
      <div class="productos-vacio">
        <div>📦</div>
        <h2>No hay productos registrados</h2>
        <p>
          Presiona “Nuevo” para registrar
          el primer producto.
        </p>
      </div>
    `;

    return;
  }

  const productosOrdenados = [...productos].sort(
    (productoA, productoB) =>
      productoA.nombre.localeCompare(
        productoB.nombre
      )
  );

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${productos.length}
      ${
        productos.length === 1
          ? "producto"
          : "productos"
      }
    </div>

    <div class="lista-productos">
      ${productosOrdenados
        .map(crearTarjetaProducto)
        .join("")}
    </div>

    <p
      id="mensajeProductoSeleccionado"
      class="aviso-accion"
    ></p>
  `;
}

function crearTarjetaProducto(producto) {
  const stock = Number(
    producto.stockAlmacen || 0
  );

  const stockMinimo = Number(
    producto.stockMinimo || 0
  );

  let estadoStock = "normal";

  if (stock === 0) {
    estadoStock = "agotado";
  } else if (stock <= stockMinimo) {
    estadoStock = "bajo";
  }

  const busqueda = [
    producto.codigo,
    producto.nombre,
    producto.categoria,
    producto.marca,
    producto.modelo,
    producto.color,
    producto.talla
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return `
    <article
      class="tarjeta-producto ${
        producto.activo ? "" : "producto-inactivo"
      }"
      data-busqueda="${escaparTexto(busqueda)}"
      data-estado-stock="${estadoStock}"
    >
      <div class="producto-encabezado">

        <div class="producto-icono">
          📦
        </div>

        <div class="producto-nombre">
          <span>
            ${escaparTexto(producto.codigo)}
          </span>

          <h2>
            ${escaparTexto(producto.nombre)}
          </h2>

          <p>
            ${escaparTexto(
              producto.categoria ||
              "Sin categoría"
            )}
          </p>
        </div>

        <span class="etiqueta-stock ${estadoStock}">
          ${
            estadoStock === "agotado"
              ? "Agotado"
              : estadoStock === "bajo"
                ? "Stock bajo"
                : "Disponible"
          }
        </span>

      </div>

      <div class="producto-detalles">

        <div>
          <span>Precio</span>
          <strong>
            ${formatearDinero(
              producto.precioVenta
            )}
          </strong>
        </div>

        <div>
          <span>Stock</span>
          <strong>${stock}</strong>
        </div>

        <div>
          <span>Mínimo</span>
          <strong>${stockMinimo}</strong>
        </div>

      </div>

      <div class="producto-descripcion">

        ${
          producto.marca
            ? `
              <span>
                Marca:
                <b>${escaparTexto(
                  producto.marca
                )}</b>
              </span>
            `
            : ""
        }

        ${
          producto.modelo
            ? `
              <span>
                Modelo:
                <b>${escaparTexto(
                  producto.modelo
                )}</b>
              </span>
            `
            : ""
        }

        ${
          producto.color
            ? `
              <span>
                Color:
                <b>${escaparTexto(
                  producto.color
                )}</b>
              </span>
            `
            : ""
        }

        ${
          producto.talla
            ? `
              <span>
                Talla:
                <b>${escaparTexto(
                  producto.talla
                )}</b>
              </span>
            `
            : ""
        }

      </div>

      ${
        producto.activo && stock > 0
          ? `
            <button
              type="button"
              class="btn-seleccionar-producto"
              data-seleccionar-producto="${
                producto.idProducto
              }"
            >
              Seleccionar para contrato
            </button>
          `
          : ""
      }
    </article>
  `;
}

function activarFiltrosProductos() {
  const buscador = document.querySelector(
    "#buscarProducto"
  );

  let filtroActual = "todos";

  function aplicarFiltros() {
    const texto = buscador.value
      .trim()
      .toLowerCase();

    document
      .querySelectorAll(".tarjeta-producto")
      .forEach((tarjeta) => {
        const coincideTexto =
          tarjeta.dataset.busqueda.includes(texto);

        const estado =
          tarjeta.dataset.estadoStock;

        const coincideFiltro =
          filtroActual === "todos" ||
          estado === filtroActual;

        tarjeta.hidden = !(
          coincideTexto && coincideFiltro
        );
      });
  }

  buscador.addEventListener(
    "input",
    aplicarFiltros
  );

  document
    .querySelectorAll(".filtro-producto")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        document
          .querySelectorAll(".filtro-producto")
          .forEach((item) =>
            item.classList.remove("activo")
          );

        boton.classList.add("activo");
        filtroActual = boton.dataset.filtro;

        aplicarFiltros();
      });
    });
}

function activarSeleccionProducto(productos) {
  document
    .querySelectorAll(
      "[data-seleccionar-producto]"
    )
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        const idProducto = Number(
          boton.dataset.seleccionarProducto
        );

        const producto = productos.find(
          (item) =>
            item.idProducto === idProducto
        );

        localStorage.setItem(
          "controlventas_producto_contrato",
          JSON.stringify(producto)
        );

        const mensaje = document.querySelector(
          "#mensajeProductoSeleccionado"
        );

        mensaje.textContent =
          `${producto.nombre} fue seleccionado ` +
          `para el contrato.`;
      });
    });
}

function mostrarFormularioProducto(
  usuario,
  volverAProductos
) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverFormularioProducto"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Nuevo producto</h1>
          <p>Registrar mercadería</p>
        </div>
      </header>

      <section class="contenido-formulario">

        <form
          id="formNuevoProducto"
          class="formulario-movil"
        >

          <div class="grupo-formulario">
            <h2>Información principal</h2>

            <div class="fila-formulario">
              <label>
                Código <b>*</b>

                <input
                  type="text"
                  id="productoCodigo"
                  placeholder="Ejemplo: ZAP-001"
                  required
                >
              </label>

              <label>
                Categoría

                <select id="productoCategoria">
                  <option value="">
                    Seleccionar
                  </option>
                  <option value="Calzado">
                    Calzado
                  </option>
                  <option value="Ropa">
                    Ropa
                  </option>
                  <option value="Hogar">
                    Hogar
                  </option>
                  <option value="Accesorios">
                    Accesorios
                  </option>
                  <option value="Otros">
                    Otros
                  </option>
                </select>
              </label>
            </div>

            <label>
              Nombre del producto <b>*</b>

              <input
                type="text"
                id="productoNombre"
                placeholder="Ejemplo: Zapatilla New Athletic"
                required
              >
            </label>
          </div>

          <div class="grupo-formulario">
            <h2>Características</h2>

            <div class="fila-formulario">
              <label>
                Marca

                <input
                  type="text"
                  id="productoMarca"
                >
              </label>

              <label>
                Modelo

                <input
                  type="text"
                  id="productoModelo"
                >
              </label>
            </div>

            <div class="fila-formulario">
              <label>
                Color

                <input
                  type="text"
                  id="productoColor"
                >
              </label>

              <label>
                Talla

                <input
                  type="text"
                  id="productoTalla"
                >
              </label>
            </div>
          </div>

          <div class="grupo-formulario">
            <h2>Precio y stock</h2>

            <label>
              Precio de venta <b>*</b>

              <input
                type="number"
                id="productoPrecio"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              >
            </label>

            <div class="fila-formulario">
              <label>
                Stock del almacén <b>*</b>

                <input
                  type="number"
                  id="productoStock"
                  min="0"
                  value="0"
                  required
                >
              </label>

              <label>
                Stock mínimo

                <input
                  type="number"
                  id="productoStockMinimo"
                  min="0"
                  value="0"
                >
              </label>
            </div>
          </div>

          <p
            id="mensajeFormularioProducto"
            class="mensaje-formulario"
          ></p>

          <button
            type="submit"
            id="btnGuardarProducto"
            class="btn-guardar-formulario"
          >
            Guardar producto
          </button>

        </form>

      </section>

    </main>
  `;

  document
    .querySelector(
      "#btnVolverFormularioProducto"
    )
    .addEventListener(
      "click",
      volverAProductos
    );

  document
    .querySelector("#formNuevoProducto")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();

      await guardarNuevoProducto(
        volverAProductos
      );
    });
}

async function guardarNuevoProducto(
  volverAProductos
) {
  const mensaje = document.querySelector(
    "#mensajeFormularioProducto"
  );

  const precio = Number(
    obtenerValor("#productoPrecio")
  );

  const stock = Number(
    obtenerValor("#productoStock")
  );

  const stockMinimo = Number(
    obtenerValor("#productoStockMinimo") || 0
  );

  if (
    precio < 0 ||
    stock < 0 ||
    stockMinimo < 0
  ) {
    mensaje.textContent =
      "El precio y el stock no pueden ser negativos.";

    mensaje.classList.add("error");
    return;
  }

  const nuevoProducto = {
    codigo: obtenerValor(
      "#productoCodigo"
    ).toUpperCase(),

    nombre: obtenerValor(
      "#productoNombre"
    ),

    categoria: valorONull(
      "#productoCategoria"
    ),

    marca: valorONull("#productoMarca"),
    modelo: valorONull("#productoModelo"),
    color: valorONull("#productoColor"),
    talla: valorONull("#productoTalla"),
    precioVenta: precio,
    stockAlmacen: stock,
    stockMinimo: stockMinimo,
    activo: true
  };

  const boton = document.querySelector(
    "#btnGuardarProducto"
  );

  mensaje.textContent = "";
  mensaje.classList.remove("error");

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const productoGuardado = await apiFetch(
      "/productos",
      {
        method: "POST",
        body: JSON.stringify(nuevoProducto)
      }
    );

    document.querySelector(
      ".contenido-formulario"
    ).innerHTML = `
      <div class="registro-exitoso">
        <div>✓</div>

        <h2>Producto registrado</h2>

        <p>
          ${escaparTexto(
            productoGuardado.nombre
          )}
          fue guardado correctamente.
        </p>

        <strong>
          ${escaparTexto(
            productoGuardado.codigo
          )}
        </strong>

        <button
          type="button"
          id="btnVolverListaProductos"
          class="btn-guardar-formulario"
        >
          Volver a productos
        </button>
      </div>
    `;

    document
      .querySelector(
        "#btnVolverListaProductos"
      )
      .addEventListener(
        "click",
        volverAProductos
      );

  } catch (error) {
    mensaje.textContent = error.message;
    mensaje.classList.add("error");

    boton.disabled = false;
    boton.textContent = "Guardar producto";
  }
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