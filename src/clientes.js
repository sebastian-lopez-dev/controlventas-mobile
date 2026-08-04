import { apiFetch } from "./api.js";

export async function mostrarClientes(usuario, volverAlInicio) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button type="button" id="btnVolverClientes" class="btn-volver">‹</button>

        <div class="cabecera-con-accion">
          <div>
            <h1>Clientes</h1>
            <p>Compradores registrados</p>
          </div>

          ${
            usuario.rol === "ADMINISTRADOR"
              ? `
            <button type="button" id="btnNuevoCliente" class="btn-agregar-cabecera">
              + Nuevo
            </button>
          `
              : ""
          }
        </div>
      </header>

      <section class="contenido-clientes">
        <div class="buscador-cobranza">
          <span>⌕</span>
          <input
            type="search"
            id="buscarCliente"
            placeholder="Buscar nombre, DNI, código o zona"
          >
        </div>

        <div id="listaClientes">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando clientes...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverClientes")
    .addEventListener("click", volverAlInicio);

  const btnNuevoCliente = document.querySelector("#btnNuevoCliente");

  if (btnNuevoCliente) {
    btnNuevoCliente.addEventListener("click", () => {
      mostrarFormularioCliente(null, () =>
        mostrarClientes(usuario, volverAlInicio),
      );
    });
  }

  try {
    const clientes = await apiFetch("/clientes");

    renderizarClientes(clientes, usuario);
    activarBuscadorClientes();
    activarAccionesClientes(clientes, usuario, volverAlInicio);
  } catch (error) {
    document.querySelector("#listaClientes").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los clientes</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function renderizarClientes(clientes, usuario) {
  const lista = document.querySelector("#listaClientes");

  if (clientes.length === 0) {
    lista.innerHTML = `
      <div class="clientes-vacio">
        <div>👥</div>
        <h2>No hay clientes registrados</h2>
        <p>Presiona “Nuevo” para registrar al primer cliente.</p>
      </div>
    `;
    return;
  }

  const clientesOrdenados = [...clientes].sort((a, b) => {
    if (a.activo === b.activo) {
      return (a.nombres || "").localeCompare(b.nombres || "");
    }

    return a.activo ? -1 : 1;
  });

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}
    </div>

    <div class="lista-clientes">
      ${clientesOrdenados
        .map((cliente) => crearTarjetaCliente(cliente, usuario))
        .join("")}
    </div>

    <p id="mensajeClientes" class="aviso-accion"></p>
  `;
}

function crearTarjetaCliente(cliente, usuario) {
  const nombreCompleto = [
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");

  const busqueda = [
    nombreCompleto,
    cliente.codigoCliente,
    cliente.dni,
    cliente.zona,
    cliente.distrito,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const iniciales = obtenerIniciales(cliente.nombres, cliente.apellidoPaterno);

  return `
    <article
      class="tarjeta-cliente ${cliente.activo ? "" : "cliente-inactivo"}"
      data-busqueda="${escaparTexto(busqueda)}"
    >
      <div class="cliente-principal">
        <div class="avatar-cliente">${escaparTexto(iniciales)}</div>

        <div class="cliente-nombre">
          <span>${escaparTexto(cliente.codigoCliente || "SIN CÓDIGO")}</span>
          <h2>${escaparTexto(nombreCompleto)}</h2>
          <p>
            ${escaparTexto(
              cliente.zona || cliente.distrito || "Zona no registrada",
            )}
          </p>
        </div>

        <span class="estado-cliente ${cliente.activo ? "activo" : "inactivo"}">
          ${cliente.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      <div class="cliente-datos">
        <p><b>DNI:</b> ${escaparTexto(cliente.dni || "No registrado")}</p>
        <p><b>Celular:</b> ${escaparTexto(cliente.celular || "No registrado")}</p>
        <p><b>Dirección:</b> ${escaparTexto(cliente.direccion || "No registrada")}</p>
      </div>

      ${
        usuario.rol === "ADMINISTRADOR"
          ? `
        <div class="acciones-cliente">
          <button
            type="button"
            class="btn-editar-cliente"
            data-editar-cliente="${cliente.idCliente}"
          >
            Editar
          </button>

          <button
            type="button"
            class="btn-eliminar-cliente"
            data-eliminar-cliente="${cliente.idCliente}"
          >
            Eliminar
          </button>
        </div>
      `
          : ""
      }
    </article>
  `;
}

function activarBuscadorClientes() {
  const buscador = document.querySelector("#buscarCliente");

  buscador.addEventListener("input", () => {
    const texto = buscador.value.trim().toLowerCase();

    document.querySelectorAll(".tarjeta-cliente").forEach((tarjeta) => {
      tarjeta.hidden = !tarjeta.dataset.busqueda.includes(texto);
    });
  });
}

function activarAccionesClientes(clientes, usuario, volverAlInicio) {
  document.querySelectorAll("[data-editar-cliente]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idCliente = Number(boton.dataset.editarCliente);
      const cliente = clientes.find((item) => item.idCliente === idCliente);

      mostrarFormularioCliente(cliente, () =>
        mostrarClientes(usuario, volverAlInicio),
      );
    });
  });

  document.querySelectorAll("[data-eliminar-cliente]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const idCliente = Number(boton.dataset.eliminarCliente);
      const cliente = clientes.find((item) => item.idCliente === idCliente);

      const nombre = [cliente.nombres, cliente.apellidoPaterno]
        .filter(Boolean)
        .join(" ");

      const confirmado = window.confirm(
        `¿Eliminar definitivamente a ${nombre}?\n\n` +
          "Esta acción no se puede deshacer.",
      );

      if (!confirmado) {
        return;
      }

      const mensaje = document.querySelector("#mensajeClientes");
      boton.disabled = true;
      boton.textContent = "Eliminando...";

      try {
        await apiFetch(`/clientes/${idCliente}/definitivo`, {
          method: "DELETE",
        });

        await mostrarClientes(usuario, volverAlInicio);
      } catch (error) {
        mensaje.textContent = error.message;
        mensaje.classList.add("error");
        boton.disabled = false;
        boton.textContent = "Eliminar";
      }
    });
  });
}

export function mostrarFormularioCliente(cliente, volverAClientes) {
  const editando = Boolean(cliente);

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverFormularioCliente"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>${editando ? "Editar cliente" : "Nuevo cliente"}</h1>
          <p>${editando ? "Actualiza los datos del comprador" : "Completa los datos del comprador"}</p>
        </div>
      </header>

      <section class="contenido-formulario">
        <form id="formCliente" class="formulario-movil">
          <div class="grupo-formulario">
            <h2>Datos personales</h2>

            <label>
              Nombres
              <input
                type="text"
                id="clienteNombres"
                value="${escaparTexto(cliente?.nombres || "")}"
                placeholder="Ejemplo: Juan Carlos"
                required
              >
            </label>

            <div class="fila-formulario">
              <label>
                Apellido paterno
                <input
                  type="text"
                  id="clienteApellidoPaterno"
                  value="${escaparTexto(cliente?.apellidoPaterno || "")}"
                  required
                >
              </label>

              <label>
                Apellido materno
                <input
                  type="text"
                  id="clienteApellidoMaterno"
                  value="${escaparTexto(cliente?.apellidoMaterno || "")}"
                >
              </label>
            </div>

            <div class="fila-formulario">
              <label>
                DNI
                <input
                  type="text"
                  id="clienteDni"
                  inputmode="numeric"
                  maxlength="8"
                  value="${escaparTexto(cliente?.dni || "")}"
                  placeholder="8 números"
                >
              </label>

              <label>
                Celular
                <input
                  type="tel"
                  id="clienteCelular"
                  inputmode="numeric"
                  maxlength="9"
                  value="${escaparTexto(cliente?.celular || "")}"
                  placeholder="9 números"
                >
              </label>
            </div>
          </div>

          <div class="grupo-formulario">
            <h2>Dirección y zona</h2>

            <label>
              Dirección
              <input
                type="text"
                id="clienteDireccion"
                value="${escaparTexto(cliente?.direccion || "")}"
                placeholder="Calle, número, lote o manzana"
              >
            </label>

            <div class="fila-formulario">
              <label>
                Distrito
                <input
                  type="text"
                  id="clienteDistrito"
                  value="${escaparTexto(cliente?.distrito || "")}"
                  placeholder="Ejemplo: VMT"
                >
              </label>

              <label>
                Zona
                <select id="clienteZona">
                  <option value="">Seleccionar</option>
                  <option value="Tablada" ${seleccionado(cliente?.zona, "Tablada")}>Tablada</option>
                  <option value="VMT" ${seleccionado(cliente?.zona, "VMT")}>VMT</option>
                  <option value="Pamplona" ${seleccionado(cliente?.zona, "Pamplona")}>Pamplona</option>
                  <option value="Otra" ${seleccionado(cliente?.zona, "Otra")}>Otra</option>
                </select>
              </label>
            </div>

            <label>
              Referencia
              <textarea
                id="clienteReferencia"
                rows="3"
                placeholder="Cerca de, frente a, color de casa..."
              >${escaparTexto(cliente?.referencia || "")}</textarea>
            </label>
          </div>

          <div class="grupo-formulario">
            <h2>Información adicional</h2>

            <label>
              Puesto de trabajo
              <input
                type="text"
                id="clientePuestoTrabajo"
                value="${escaparTexto(cliente?.puestoTrabajo || "")}"
                placeholder="Trabajo o negocio del cliente"
              >
            </label>
          </div>

          <p id="mensajeFormularioCliente" class="mensaje-formulario"></p>

          <button type="submit" id="btnGuardarCliente" class="btn-guardar-formulario">
            ${editando ? "Guardar cambios" : "Guardar cliente"}
          </button>
        </form>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverFormularioCliente")
    .addEventListener("click", volverAClientes);

  document
    .querySelector("#formCliente")
    .addEventListener("submit", async (evento) => {
      evento.preventDefault();
      await guardarCliente(cliente, volverAClientes);
    });
}

async function guardarCliente(clienteEditado, volverAClientes) {
  const dni = obtenerValor("#clienteDni");
  const celular = obtenerValor("#clienteCelular");
  const mensaje = document.querySelector("#mensajeFormularioCliente");

  if (dni && !/^\d{8}$/.test(dni)) {
    mostrarError(mensaje, "El DNI debe tener exactamente 8 números.");
    return;
  }

  if (celular && !/^\d{9}$/.test(celular)) {
    mostrarError(mensaje, "El celular debe tener exactamente 9 números.");
    return;
  }

  const datosCliente = {
    nombres: obtenerValor("#clienteNombres"),
    apellidoPaterno: obtenerValor("#clienteApellidoPaterno"),
    apellidoMaterno: valorONull("#clienteApellidoMaterno"),
    dni: dni || null,
    celular: celular || null,
    direccion: valorONull("#clienteDireccion"),
    distrito: valorONull("#clienteDistrito"),
    zona: valorONull("#clienteZona"),
    referencia: valorONull("#clienteReferencia"),
    puestoTrabajo: valorONull("#clientePuestoTrabajo"),
    activo: clienteEditado ? clienteEditado.activo : true,
  };

  const editando = Boolean(clienteEditado);
  const boton = document.querySelector("#btnGuardarCliente");

  mensaje.textContent = "";
  mensaje.classList.remove("error");
  boton.disabled = true;
  boton.textContent = editando ? "Guardando cambios..." : "Guardando...";

  try {
    const clienteGuardado = await apiFetch(
      editando ? `/clientes/${clienteEditado.idCliente}` : "/clientes",
      {
        method: editando ? "PUT" : "POST",
        body: JSON.stringify(datosCliente),
      },
    );

    document.querySelector(".contenido-formulario").innerHTML = `
      <div class="registro-exitoso">
        <div>✓</div>
        <h2>${editando ? "Cliente actualizado" : "Cliente registrado"}</h2>
        <p>
          ${escaparTexto(clienteGuardado.nombres)}
          ${escaparTexto(clienteGuardado.apellidoPaterno)}
          fue ${editando ? "actualizado" : "guardado"} correctamente.
        </p>
        <strong>${escaparTexto(clienteGuardado.codigoCliente)}</strong>
        <button
          type="button"
          id="btnVolverListaClientes"
          class="btn-guardar-formulario"
        >
          Volver a clientes
        </button>
      </div>
    `;

    document
      .querySelector("#btnVolverListaClientes")
      .addEventListener("click", volverAClientes);
  } catch (error) {
    mostrarError(mensaje, error.message);
    boton.disabled = false;
    boton.textContent = editando ? "Guardar cambios" : "Guardar cliente";
  }
}

function seleccionado(valorActual, valorOpcion) {
  return valorActual === valorOpcion ? "selected" : "";
}

function mostrarError(elemento, texto) {
  elemento.textContent = texto;
  elemento.classList.add("error");
}

function obtenerIniciales(nombres, apellidoPaterno) {
  const primera = nombres ? nombres.charAt(0) : "";
  const segunda = apellidoPaterno ? apellidoPaterno.charAt(0) : "";
  return `${primera}${segunda}`.toUpperCase();
}

function obtenerValor(selector) {
  return document.querySelector(selector).value.trim();
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