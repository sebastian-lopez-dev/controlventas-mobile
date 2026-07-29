import {
  mostrarCobrosDeHoy
} from "./cobranza.js";

import {
  mostrarClientes
} from "./clientes.js";

import {
  mostrarProductos
} from "./productos.js";

import {
  mostrarSalidas
} from "./salidas.js";

import {
  mostrarContrato
} from "./contratos.js";

import {
  mostrarHistorial
} from "./historial.js";

import {
  mostrarCobranzaAdministrador
} from "./cobranza-admin.js";

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

      <header class="cabecera-aplicacion">
        <div class="cabecera-marca">
          <div class="logo-pequeno">CV</div>

          <div>
            <span>ControlVentas</span>
            <small>Negocio familiar</small>
          </div>
        </div>

        <button
          type="button"
          id="btnCerrarSesion"
          class="btn-cerrar-sesion"
        >
          Salir
        </button>
      </header>

      <section class="contenido-inicio">

        <div class="saludo-usuario">
          <p>Buenos días</p>
          <h1>${usuario.nombreCompleto}</h1>
          <span>Administrador</span>
        </div>

        <article class="tarjeta-ruta">
          <div class="tarjeta-ruta-texto">
            <span>RUTA DEL SÁBADO</span>
            <h2>No hay una salida abierta</h2>
            <p>
              Registra la mercadería que llevarán
              en el carro.
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

          <button
            type="button"
            class="opcion-menu"
            data-accion="Salidas"
          >
            <span class="opcion-icono azul">🚚</span>
            <strong>Salidas</strong>
            <small>Mercadería del carro</small>
          </button>

          <button
            type="button"
            class="opcion-menu"
            data-accion="Contratos"
          >
            <span class="opcion-icono morado">📄</span>
            <strong>Contratos</strong>
            <small>Registrar una venta</small>
          </button>

          <button
            type="button"
            class="opcion-menu"
            data-accion="Clientes"
          >
            <span class="opcion-icono celeste">👥</span>
            <strong>Clientes</strong>
            <small>Datos e historial</small>
          </button>

          <button
            type="button"
            class="opcion-menu"
            data-accion="Productos"
          >
            <span class="opcion-icono naranja">📦</span>
            <strong>Productos</strong>
            <small>Stock del almacén</small>
          </button>

          <button
            type="button"
            class="opcion-menu"
            data-accion="Cobranza"
          >
            <span class="opcion-icono verde">💵</span>
            <strong>Cobranza</strong>
            <small>Pagos y saldos</small>
          </button>

          <button
            type="button"
            class="opcion-menu"
            data-accion="Reportes"
          >
            <span class="opcion-icono rojo">📊</span>
            <strong>Reportes</strong>
            <small>Resumen del negocio</small>
          </button>

        </div>

        <p id="avisoAccion" class="aviso-accion"></p>

      </section>

      <nav class="navegacion-inferior">

        <button class="navegacion-activa">
          <span>⌂</span>
          Inicio
        </button>

        <button data-accion="Clientes">
          <span>♙</span>
          Clientes
        </button>

        <button data-accion="Contratos">
          <span>＋</span>
          Contrato
        </button>

        <button data-accion="Cobranza">
          <span>S/</span>
          Cobranza
        </button>

        <button data-accion="Más">
          <span>•••</span>
          Más
        </button>

      </nav>

    </main>
  `;

  activarEventosInicio();
}

function mostrarInicioCobrador(usuario) {
  const fechaActual = new Date().toLocaleDateString(
    "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  );

  document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">

      <header class="cabecera-aplicacion cobrador">
        <div class="cabecera-marca">
          <div class="logo-pequeno verde">G</div>

          <div>
            <span>ControlVentas</span>
            <small>Cobranza móvil</small>
          </div>
        </div>

        <button
          type="button"
          id="btnCerrarSesion"
          class="btn-cerrar-sesion"
        >
          Salir
        </button>
      </header>

      <section class="contenido-inicio">

        <div class="saludo-usuario">
          <p>Buenos días</p>
          <h1>${usuario.nombreCompleto}</h1>
          <span>Cobrador</span>
        </div>

        <article class="tarjeta-cobranza-hoy">
          <span>COBRANZA DE HOY</span>
          <h2>0 clientes pendientes</h2>
          <p>${fechaActual}</p>

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
              <small>Clientes asignados a Gregorio</small>
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

      <nav class="navegacion-inferior">

        <button class="navegacion-activa">
          <span>⌂</span>
          Inicio
        </button>

        <button data-accion="Cobros de hoy">
          <span>S/</span>
          Cobrar
        </button>

        <button data-accion="Clientes asignados">
          <span>♙</span>
          Clientes
        </button>

        <button data-accion="Historial">
          <span>◷</span>
          Historial
        </button>

      </nav>

    </main>
  `;

  activarEventosInicio();
}

function activarEventosInicio() {
  const btnCerrarSesion =
    document.querySelector("#btnCerrarSesion");

  btnCerrarSesion.addEventListener("click", () => {
    localStorage.removeItem("controlventas_token");
    localStorage.removeItem("controlventas_usuario");

    window.location.reload();
  });

  document
    .querySelectorAll("[data-accion]")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        const accion = boton.dataset.accion;

        const usuarioGuardado = JSON.parse(
          localStorage.getItem(
            "controlventas_usuario"
          )
        );

        if (accion === "Cobros de hoy") {
          mostrarCobrosDeHoy(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (accion === "Clientes") {
          mostrarClientes(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (accion === "Productos") {
          mostrarProductos(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (
          accion === "Salidas" ||
          accion === "Nueva salida"
        ) {
          mostrarSalidas(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (
          accion === "Contratos" ||
          accion === "Contrato"
        ) {
          mostrarContrato(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (accion === "Historial") {
          mostrarHistorial(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        if (
          accion === "Cobranza" &&
          usuarioGuardado.rol === "ADMINISTRADOR"
        ) {
          mostrarCobranzaAdministrador(
            usuarioGuardado,
            () => mostrarInicio(usuarioGuardado)
          );

          return;
        }

        const aviso = document.querySelector(
          "#avisoAccion"
        );

        if (aviso) {
          aviso.textContent =
            `Seleccionaste: ${accion}. ` +
            `Construiremos esta sección a continuación.`;
        }
      });
    });
}