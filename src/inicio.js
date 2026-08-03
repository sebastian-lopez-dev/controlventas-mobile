import { apiFetch } from "./api.js";
import { mostrarCobrosDeHoy } from "./cobranza.js";
import { mostrarClientes } from "./clientes.js";
import { mostrarProductos } from "./productos.js";
import { mostrarSalidas } from "./salidas.js";
import { mostrarContrato } from "./contratos.js";
import { mostrarHistorial } from "./historial.js";
import { mostrarCobranzaAdministrador } from "./cobranza-admin.js";

export function mostrarInicio(usuario) {
  if (usuario.rol === "COBRADOR") {
    mostrarInicioCobrador(usuario);
    return;
  }

  mostrarInicioAdministrador(usuario);
}

function mostrarInicioAdministrador(usuario) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <section class="contenido-inicio">
        <div class="saludo-con-salida">
          <div class="saludo-usuario">
            <p>${obtenerSaludo()}</p>
            <h1>${escaparTexto(usuario.nombreCompleto)}</h1>
          </div>

          <button
            type="button"
            id="btnCerrarSesion"
            class="btn-cerrar-sesion"
          >
            Salir
          </button>
        </div>

        <article class="tarjeta-ruta">
          <div class="tarjeta-ruta-texto">
            <span>RUTA DEL SÁBADO</span>
            <h2>No hay una salida abierta</h2>
            <p>
              Registra la mercadería que llevarán en el carro.
            </p>
          </div>

          <button
            type="button"
            class="btn-nueva-salida"
            data-accion="Nueva salida"
          >
            + Nueva salida
          </button>
        </article>

        <div class="titulo-seccion">
          <h2>¿Qué deseas hacer?</h2>
          <p>Selecciona una opción para continuar</p>
        </div>

        <div class="menu-principal">
          <button type="button" class="opcion-menu" data-accion="Salidas">
            <span class="opcion-icono azul">🚚</span>
            <strong>Salidas</strong>
            <small>Mercadería del carro</small>
          </button>

          <button type="button" class="opcion-menu" data-accion="Contratos">
            <span class="opcion-icono morado">📄</span>
            <strong>Contratos</strong>
            <small>Registrar una venta</small>
          </button>

          <button type="button" class="opcion-menu" data-accion="Clientes">
            <span class="opcion-icono celeste">👥</span>
            <strong>Clientes</strong>
            <small>Datos e historial</small>
          </button>

          <button type="button" class="opcion-menu" data-accion="Productos">
            <span class="opcion-icono naranja">📦</span>
            <strong>Productos</strong>
            <small>Stock del almacén</small>
          </button>

          <button type="button" class="opcion-menu" data-accion="Cobranza">
            <span class="opcion-icono verde">💵</span>
            <strong>Cobranza</strong>
            <small>Pagos y saldos</small>
          </button>

          <button type="button" class="opcion-menu" data-accion="Reportes">
            <span class="opcion-icono rojo">📊</span>
            <strong>Reportes</strong>
            <small>Resumen del negocio</small>
          </button>
        </div>

        <p id="avisoAccion" class="aviso-accion"></p>
      </section>
    </main>
  `;

  activarEventosInicio(usuario);
}

async function mostrarInicioCobrador(usuario) {
  const nombreCobrador = obtenerPrimerNombre(usuario.nombreCompleto);

  const fechaActual = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <section class="contenido-inicio">
        <div class="saludo-con-salida">
          <div class="saludo-usuario">
            <p>${obtenerSaludo()}</p>
            <h1>${escaparTexto(nombreCobrador)}</h1>
          </div>

          <button
            type="button"
            id="btnCerrarSesion"
            class="btn-cerrar-sesion"
          >
            Salir
          </button>
        </div>

        <article class="tarjeta-cobranza-hoy">
          <span>COBRANZA DE HOY</span>
          <h2 id="cantidadCobrosHoy">Cargando...</h2>
          <p>${escaparTexto(fechaActual)}</p>

          <button
            type="button"
            class="btn-ver-cobros"
            data-accion="Cobros de hoy"
          >
            Ver cobros de hoy
          </button>
        </article>

        <div class="titulo-seccion">
          <h2>Mi trabajo</h2>
          <p>Registra los cobros realizados</p>
        </div>

        <div class="menu-cobrador">
          <button
            type="button"
            class="opcion-cobrador"
            data-accion="Cobros de hoy"
          >
            <span class="opcion-icono verde">💵</span>

            <div>
              <strong>Cobros de hoy</strong>
              <small>Clientes que deben pagar</small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-accion="Clientes asignados"
          >
            <span class="opcion-icono azul">👥</span>

            <div>
              <strong>Mis clientes</strong>
              <small id="cantidadClientesAsignados">
                Cargando clientes asignados...
              </small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-accion="Historial"
          >
            <span class="opcion-icono morado">🕘</span>

            <div>
              <strong>Historial</strong>
              <small>Pagos registrados anteriormente</small>
            </div>

            <b>›</b>
          </button>
        </div>

        <p id="avisoAccion" class="aviso-accion"></p>
      </section>
    </main>
  `;

  activarEventosInicio(usuario);
  await cargarResumenCobrador(usuario);
}

async function cargarResumenCobrador(usuario) {
  const cantidadCobros = document.querySelector("#cantidadCobrosHoy");
  const cantidadClientes = document.querySelector("#cantidadClientesAsignados");

  if (!usuario.idCobrador) {
    cantidadCobros.textContent = "Sin cobrador relacionado";
    cantidadClientes.textContent = "Sin cobrador relacionado";
    return;
  }

  try {
    const [cobranzas, ventas] = await Promise.all([
      apiFetch(`/cobranzas/cobrador/${usuario.idCobrador}/hoy`),
      apiFetch(`/ventas/cobrador/${usuario.idCobrador}`),
    ]);

    const clientesDeHoy = new Set(
      cobranzas.map((cobranza) => cobranza.idCliente),
    ).size;

    const clientesAsignados = new Set(
      ventas.map((venta) => venta.cliente?.idCliente).filter(Boolean),
    ).size;

    cantidadCobros.textContent = `${clientesDeHoy} ${
      clientesDeHoy === 1 ? "cliente pendiente" : "clientes pendientes"
    }`;

    cantidadClientes.textContent = `${clientesAsignados} ${
      clientesAsignados === 1 ? "cliente asignado" : "clientes asignados"
    }`;
  } catch (error) {
    cantidadCobros.textContent = "No se pudo cargar";
    cantidadClientes.textContent = "No se pudo cargar";
  }
}

async function mostrarClientesAsignadosCobrador(usuario, volverAlInicio) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverClientesAsignados"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>Mis clientes</h1>
          <p>Clientes asignados a ${escaparTexto(
            obtenerPrimerNombre(usuario.nombreCompleto),
          )}</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <div class="buscador-cobranza">
          <span>⌕</span>

          <input
            type="search"
            id="buscarClienteAsignado"
            placeholder="Buscar cliente, contrato o zona"
          >
        </div>

        <div id="listaClientesAsignados">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando clientes...</p>
          </div>
        </div>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverClientesAsignados")
    .addEventListener("click", volverAlInicio);

  try {
    const ventas = await apiFetch(`/ventas/cobrador/${usuario.idCobrador}`);

    const clientes = agruparClientesAsignados(ventas);
    renderizarClientesAsignados(clientes);
    activarBuscadorClientesAsignados();
  } catch (error) {
    document.querySelector("#listaClientesAsignados").innerHTML = `
      <div class="error-cobranza">
        <div>!</div>
        <h2>No se pudieron cargar los clientes</h2>
        <p>${escaparTexto(error.message)}</p>
      </div>
    `;
  }
}

function agruparClientesAsignados(ventas) {
  const clientes = new Map();

  ventas.forEach((venta) => {
    const cliente = venta.cliente;

    if (!cliente?.idCliente) {
      return;
    }

    if (!clientes.has(cliente.idCliente)) {
      clientes.set(cliente.idCliente, {
        ...cliente,
        cantidadContratos: 0,
        saldoTotal: 0,
        contratos: [],
      });
    }

    const clienteAgrupado = clientes.get(cliente.idCliente);
    clienteAgrupado.cantidadContratos += 1;
    clienteAgrupado.saldoTotal += Number(venta.saldoPendiente || 0);
    clienteAgrupado.contratos.push(venta.numeroContrato);
  });

  return [...clientes.values()].sort((clienteA, clienteB) =>
    obtenerNombreCliente(clienteA).localeCompare(
      obtenerNombreCliente(clienteB),
    ),
  );
}

function renderizarClientesAsignados(clientes) {
  const lista = document.querySelector("#listaClientesAsignados");

  if (clientes.length === 0) {
    lista.innerHTML = `
      <div class="cobranza-vacia">
        <div>👥</div>
        <h2>No hay clientes asignados</h2>
        <p>Los clientes con contrato aparecerán aquí.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = `
    <div class="cantidad-resultados">
      ${clientes.length}
      ${clientes.length === 1 ? "cliente" : "clientes"}
    </div>

    <div class="lista-cobranzas">
      ${clientes
        .map((cliente) => {
          const nombre = obtenerNombreCliente(cliente);
          const busqueda = [
            nombre,
            cliente.codigoCliente,
            cliente.dni,
            cliente.zona,
            ...cliente.contratos,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return `
            <article
              class="tarjeta-cobranza tarjeta-cliente-asignado"
              data-busqueda-cliente="${escaparTexto(busqueda)}"
            >
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    ${escaparTexto(cliente.codigoCliente || "SIN CÓDIGO")}
                  </span>
                  <h2>${escaparTexto(nombre)}</h2>
                </div>

                <span class="estado-cuota pendiente">ACTIVO</span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Contratos</span>
                  <strong>${cliente.cantidadContratos}</strong>
                </div>

                <div>
                  <span>Saldo total</span>
                  <strong>${formatearDinero(cliente.saldoTotal)}</strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Zona:</b>
                  ${escaparTexto(cliente.zona || "No registrada")}
                </p>
                <p>
                  <b>Dirección:</b>
                  ${escaparTexto(cliente.direccion || "No registrada")}
                </p>
                <p>
                  <b>Celular:</b>
                  ${escaparTexto(cliente.celular || "No registrado")}
                </p>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function activarBuscadorClientesAsignados() {
  const buscador = document.querySelector("#buscarClienteAsignado");

  buscador.addEventListener("input", () => {
    const texto = normalizarTexto(buscador.value);

    document.querySelectorAll("[data-busqueda-cliente]").forEach((tarjeta) => {
      tarjeta.hidden = !normalizarTexto(
        tarjeta.dataset.busquedaCliente,
      ).includes(texto);
    });
  });
}

function activarEventosInicio(usuarioActual) {
  document.querySelector("#btnCerrarSesion").addEventListener("click", () => {
    localStorage.removeItem("controlventas_token");
    localStorage.removeItem("controlventas_usuario");
    window.location.reload();
  });

  document.querySelectorAll("[data-accion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const accion = boton.dataset.accion;
      const usuarioGuardado = obtenerUsuarioGuardado(usuarioActual);
      const volver = () => mostrarInicio(usuarioGuardado);

      if (accion === "Cobros de hoy") {
        mostrarCobrosDeHoy(usuarioGuardado, volver);
        return;
      }

      if (accion === "Clientes asignados") {
        mostrarClientesAsignadosCobrador(usuarioGuardado, volver);
        return;
      }

      if (accion === "Clientes") {
        mostrarClientes(usuarioGuardado, volver);
        return;
      }

      if (accion === "Productos") {
        mostrarProductos(usuarioGuardado, volver);
        return;
      }

      if (accion === "Salidas" || accion === "Nueva salida") {
        mostrarSalidas(usuarioGuardado, volver);
        return;
      }

      if (accion === "Contratos" || accion === "Contrato") {
        mostrarContrato(usuarioGuardado, volver);
        return;
      }

      if (accion === "Historial") {
        mostrarHistorial(usuarioGuardado, volver);
        return;
      }

      if (accion === "Cobranza" && usuarioGuardado.rol === "ADMINISTRADOR") {
        mostrarCobranzaAdministrador(usuarioGuardado, volver);
        return;
      }

      const aviso = document.querySelector("#avisoAccion");

      if (aviso) {
        aviso.textContent =
          `Seleccionaste: ${accion}. ` +
          "Construiremos esta sección a continuación.";
      }
    });
  });
}

function obtenerUsuarioGuardado(usuarioActual) {
  try {
    return (
      JSON.parse(localStorage.getItem("controlventas_usuario")) || usuarioActual
    );
  } catch {
    return usuarioActual;
  }
}

function obtenerPrimerNombre(nombreCompleto) {
  return String(nombreCompleto || "Cobrador")
    .trim()
    .split(/\s+/)[0];
}

function obtenerNombreCliente(cliente) {
  const nombre = [
    cliente.nombres,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");

  return nombre || "Cliente";
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatearDinero(valor) {
  return Number(valor || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
  });
}

function escaparTexto(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obtenerSaludo() {
  const horaActual = new Date().getHours();

  if (
    horaActual >= 5 &&
    horaActual < 12
  ) {
    return "Buenos días";
  }

  if (
    horaActual >= 12 &&
    horaActual < 19
  ) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}