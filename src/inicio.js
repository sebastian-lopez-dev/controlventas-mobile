import { apiFetch } from "./api.js";
import { mostrarCobrosDeHoy } from "./cobranza.js";
import { mostrarClientes } from "./clientes.js";
import { mostrarProductos } from "./productos.js";
import {
  mostrarSalidas,
  mostrarFormularioSalida
} from "./salidas.js";
import { mostrarContrato } from "./contratos.js";
import { mostrarHistorial } from "./historial.js";
import { mostrarCobranzaAdministrador } from "./cobranza-admin.js";
import { mostrarPrestamos } from "./prestamos.js";
import { mostrarPagosPrestamos } from "./pagos-prestamos.js";
import { mostrarHistorialPagosPrestamos } from "./historial-pagos-prestamos.js";
import { mostrarClientesPrestamos } from "./clientes-prestamos.js";
import { mostrarReportesPrestamos } from "./reportes-prestamos.js";
import { mostrarNuevoPrestamo } from "./nuevo-prestamo.js";
import { mostrarReportes } from "./reportes.js";


export function mostrarInicio(usuario) {
  if (usuario.rol === "COBRADOR") {
    mostrarInicioCobrador(usuario);
    return;
  }

  mostrarSeleccionNegocio(usuario);
}

function mostrarSeleccionNegocio(usuario) {
  const nombre = obtenerPrimerNombre(
    usuario.nombreCompleto || "Christian"
  );

  document.querySelector("#app").innerHTML = `
    <main
      class="aplicacion-movil"
      style="
        min-height: 100dvh;
        background: #eef2f7;
      "
    >
      <section
        style="
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        "
      >
        <header
          style="
            position: relative;
            overflow: hidden;
            padding: 42px 27px 65px;
            color: #ffffff;
            background:
              linear-gradient(
                145deg,
                #101c31 0%,
                #172d50 55%,
                #1d3d6d 100%
              );
          "
        >
          <div
            style="
              position: absolute;
              top: -65px;
              right: -70px;
              width: 190px;
              height: 190px;
              border: 35px solid rgba(255,255,255,0.04);
              border-radius: 50%;
            "
          ></div>

          <div
            style="
              position: relative;
              z-index: 1;
              display: flex;
              align-items: center;
              gap: 14px;
              margin-bottom: 35px;
            "
          >
            <div
              style="
                width: 50px;
                height: 50px;
                display: grid;
                place-items: center;
                border: 1px solid rgba(255,255,255,0.20);
                border-radius: 14px;
                background: rgba(255,255,255,0.10);
                font-size: 25px;
              "
            >
              ◆
            </div>

            <div>
              <strong
                style="
                  display: block;
                  font-size: 17px;
                  letter-spacing: 0.3px;
                "
              >
                Corazón de Jesús
              </strong>

              <small
                style="
                  color: #b9c8df;
                  font-size: 12px;
                "
              >
                Sistema de gestión
              </small>
            </div>

            <button
              type="button"
              id="btnCerrarSesionSeleccion"
              aria-label="Cerrar sesión y volver al login"
              style="
                margin-left: auto;
                padding: 9px 14px;
                color: #ffffff;
                font-size: 12px;
                font-weight: 700;
                background: rgba(255,255,255,0.10);
                border: 1px solid rgba(255,255,255,0.22);
                border-radius: 10px;
                cursor: pointer;
              "
            >
              Salir
            </button>
          </div>

          <div style="position: relative; z-index: 1;">
            <p
              style="
                margin: 0 0 7px;
                color: #b9c8df;
                font-size: 14px;
                font-weight: 500;
              "
            >
              Bienvenido nuevamente
            </p>

            <h1
              style="
                margin: 0;
                font-size: 31px;
                line-height: 1.1;
                font-weight: 800;
              "
            >
              ${escaparTexto(nombre)}
            </h1>

            <p
              style="
                margin: 15px 0 0;
                max-width: 310px;
                color: #d0daea;
                font-size: 14px;
                line-height: 1.55;
              "
            >
              Selecciona el área del negocio que deseas administrar.
            </p>
          </div>
        </header>

        <section
          style="
            position: relative;
            z-index: 2;
            flex: 1;
            margin-top: -34px;
            padding: 0 24px 32px;
          "
        >
          <div
            style="
              padding: 25px 20px;
              background: #ffffff;
              border: 1px solid #dce3ed;
              border-radius: 22px;
              box-shadow: 0 18px 45px rgba(18, 36, 65, 0.13);
            "
          >
            <div style="margin-bottom: 21px;">
              <h2
                style="
                  margin: 0 0 6px;
                  color: #15243d;
                  font-size: 20px;
                "
              >
                Paneles disponibles
              </h2>

              <p
                style="
                  margin: 0;
                  color: #7e8ca3;
                  font-size: 13px;
                  line-height: 1.45;
                "
              >
                Ingresa al sistema que vas a utilizar.
              </p>
            </div>

            <div
              style="
                display: flex;
                flex-direction: column;
                gap: 14px;
              "
            >
              <button
                type="button"
                id="btnVentasCredito"
                style="
                  width: 100%;
                  min-height: 112px;
                  padding: 19px;
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  color: #ffffff;
                  text-align: left;
                  background:
                    linear-gradient(
                      135deg,
                      #285fc7,
                      #153f91
                    );
                  border: 0;
                  border-radius: 17px;
                  box-shadow: 0 10px 22px rgba(31, 81, 177, 0.24);
                  cursor: pointer;
                "
              >
                <span
                  style="
                    width: 58px;
                    height: 58px;
                    flex-shrink: 0;
                    display: grid;
                    place-items: center;
                    border: 1px solid rgba(255,255,255,0.18);
                    border-radius: 15px;
                    background: rgba(255,255,255,0.13);
                    font-size: 27px;
                  "
                >
                  ▣
                </span>

                <span style="flex: 1;">
                  <strong
                    style="
                      display: block;
                      margin-bottom: 7px;
                      font-size: 18px;
                    "
                  >
                    Ventas a crédito
                  </strong>

                  <small
                    style="
                      display: block;
                      color: #d4e0f5;
                      font-size: 12px;
                      line-height: 1.45;
                    "
                  >
                    Productos, contratos, salidas y cobranza.
                  </small>
                </span>

                <span
                  style="
                    font-size: 28px;
                    font-weight: 300;
                  "
                >
                  ›
                </span>
              </button>

              <button
                type="button"
                id="btnPrestamosEfectivo"
                style="
                  width: 100%;
                  min-height: 112px;
                  padding: 19px;
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  color: #ffffff;
                  text-align: left;
                  background:
                    linear-gradient(
                      135deg,
                      #168867,
                      #075b47
                    );
                  border: 0;
                  border-radius: 17px;
                  box-shadow: 0 10px 22px rgba(10, 105, 79, 0.22);
                  cursor: pointer;
                "
              >
                <span
                  style="
                    width: 58px;
                    height: 58px;
                    flex-shrink: 0;
                    display: grid;
                    place-items: center;
                    border: 1px solid rgba(255,255,255,0.18);
                    border-radius: 15px;
                    background: rgba(255,255,255,0.13);
                    font-size: 27px;
                  "
                >
                  S/
                </span>

                <span style="flex: 1;">
                  <strong
                    style="
                      display: block;
                      margin-bottom: 7px;
                      font-size: 18px;
                    "
                  >
                    Préstamos en efectivo
                  </strong>

                  <small
                    style="
                      display: block;
                      color: #d3eee7;
                      font-size: 12px;
                      line-height: 1.45;
                    "
                  >
                    Préstamos, pagos, clientes y reportes.
                  </small>
                </span>

                <span
                  style="
                    font-size: 28px;
                    font-weight: 300;
                  "
                >
                  ›
                </span>
              </button>
            </div>
          </div>

          <div
            style="
              margin-top: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              color: #8692a6;
              font-size: 12px;
            "
          >
            <span>●</span>
            <span>Acceso exclusivo del administrador</span>
          </div>
        </section>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVentasCredito")
    .addEventListener("click", () => {
      mostrarInicioAdministrador(usuario);
    });

  document
    .querySelector("#btnPrestamosEfectivo")
    .addEventListener("click", () => {
      mostrarInicioPrestamos(usuario);
    });

  document
    .querySelector("#btnCerrarSesionSeleccion")
    .addEventListener("click", () => {
      localStorage.removeItem("controlventas_token");
      localStorage.removeItem("controlventas_usuario");
      window.location.reload();
    });
}

async function mostrarInicioPrestamos(usuario) {
  const prestamos = await apiFetch("/prestamos");

  const totalPendientePrestamos = prestamos.reduce(
    (total, prestamo) =>
      total + Number(prestamo.saldoPendiente || 0),
    0
  );

  const prestamosActivos = prestamos.filter(
    (prestamo) => Number(prestamo.saldoPendiente || 0) > 0
  ).length;
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <section class="contenido-inicio">
        <div class="saludo-con-salida">
          <div class="saludo-usuario">
            <p>${obtenerSaludo()}</p>
            <h1>Christian</h1>
          </div>

          <button
            type="button"
            id="btnVolverNegocios"
            class="btn-cerrar-sesion"
          >
            Volver
          </button>
        </div>

        <article class="tarjeta-cobranza-hoy">
          <span>RESUMEN DE PRÉSTAMOS</span>
       <h2>
  ${totalPendientePrestamos.toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN"
  })} pendiente
</h2>

<p>
  ${prestamos.length === 0
      ? "Todavía no hay préstamos registrados"
      : `${prestamosActivos} ${prestamosActivos === 1
        ? "préstamo activo"
        : "préstamos activos"
      }`
    }
</p>

          <button
            type="button"
            class="btn-ver-cobros"
            data-prestamo-accion="Nuevo préstamo"
          >
            + Nuevo préstamo
          </button>
        </article>

        <div class="titulo-seccion">
          <h2>¿Qué deseas hacer?</h2>
          <p>Administra el dinero prestado y los pagos</p>
        </div>

        <div class="menu-cobrador">
          <button
            type="button"
            class="opcion-cobrador"
            data-prestamo-accion="Préstamos"
          >
            <span class="opcion-icono azul">💰</span>

            <div>
              <strong>Préstamos</strong>
              <small>Ver préstamos activos y finalizados</small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-prestamo-accion="Registrar pago"
          >
            <span class="opcion-icono verde">💵</span>

            <div>
              <strong>Registrar pago</strong>
              <small>Anotar el dinero recibido</small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-prestamo-accion="Clientes"
          >
            <span class="opcion-icono celeste">👥</span>

            <div>
              <strong>Clientes</strong>
              <small>Personas que recibieron préstamos</small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-prestamo-accion="Historial"
          >
            <span class="opcion-icono morado">🕘</span>

            <div>
              <strong>Historial de pagos</strong>
              <small>Pagos registrados anteriormente</small>
            </div>

            <b>›</b>
          </button>

          <button
            type="button"
            class="opcion-cobrador"
            data-prestamo-accion="Reportes"
          >
            <span class="opcion-icono naranja">📊</span>

            <div>
              <strong>Reportes</strong>
              <small>Prestado, cobrado y pendiente</small>
            </div>

            <b>›</b>
          </button>
        </div>

        <p id="avisoPrestamos" class="aviso-accion"></p>
      </section>
    </main>
  `;

  document
    .querySelector("#btnVolverNegocios")
    .addEventListener("click", () => {
      mostrarSeleccionNegocio(usuario);
    });

  document
    .querySelectorAll("[data-prestamo-accion]")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        const accion = boton.dataset.prestamoAccion;

        if (accion === "Préstamos") {
          mostrarPrestamos(
            usuario,
            () => mostrarInicioPrestamos(usuario),
          );
          return;
        }

        if (accion === "Registrar pago") {
          mostrarPagosPrestamos(
            usuario,
            () => mostrarInicioPrestamos(usuario),
          );
          return;
        }

        if (accion === "Historial") {
          mostrarHistorialPagosPrestamos(
            usuario,
            () => mostrarInicioPrestamos(usuario),
          );
          return;
        }

        if (accion === "Clientes") {
          mostrarClientesPrestamos(
            usuario,
            () => mostrarInicioPrestamos(usuario),
          );
          return;
        }

        if (accion === "Reportes") {
          mostrarReportesPrestamos(
            usuario,
            () => mostrarInicioPrestamos(usuario),
          );
          return;
        }

        if (accion === "Nuevo préstamo") {
          mostrarNuevoPrestamo(
            usuario,
            () => mostrarInicioPrestamos(usuario)
          );
          return;
        }

        document.querySelector("#avisoPrestamos").textContent =
          `Seleccionaste: ${accion}.`;
      });
    });
}

function mostrarInicioAdministrador(usuario) {
  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <section class="contenido-inicio">
        <div class="saludo-con-salida">
          <div class="saludo-usuario">
            <p>${obtenerSaludo()}</p>
            <h1>Christian</h1>
          </div>

          <button
            type="button"
            id="btnCerrarSesion"
            class="btn-cerrar-sesion"
          >
            Volver
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

    cantidadCobros.textContent = `${clientesDeHoy} ${clientesDeHoy === 1 ? "cliente pendiente" : "clientes pendientes"
      }`;

    cantidadClientes.textContent = `${clientesAsignados} ${clientesAsignados === 1 ? "cliente asignado" : "clientes asignados"
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
    if (usuarioActual.rol === "ADMINISTRADOR") {
      mostrarSeleccionNegocio(usuarioActual);
      return;
    }

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

      if (accion === "Nueva salida") {
        mostrarFormularioSalida(
          usuarioGuardado,
          () => mostrarSalidas(usuarioGuardado, volver)
        );
        return;
      }

      if (accion === "Salidas") {
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

      if (
        accion === "Reportes" &&
        usuarioGuardado.rol === "ADMINISTRADOR"
      ) {
        mostrarReportes(
          usuarioGuardado,
          volver
        );
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