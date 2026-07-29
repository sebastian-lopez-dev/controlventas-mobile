import "./style.css";

import { mostrarInicio } from "./inicio.js";

import {
    iniciarInstalacionPWA
} from "./instalacion.js";

iniciarInstalacionPWA();

document.querySelector("#app").innerHTML = `
  <main class="pagina-login">
    <section class="login-contenedor">

      <div class="marca">
        <div class="marca-icono">CV</div>

        <div>
          <h2>ControlVentas</h2>
          <p>Ventas y cobranzas</p>
        </div>
      </div>

      <div class="etiqueta-negocio">
        Negocio familiar
      </div>

      <div class="presentacion">
        <h1>Bienvenido</h1>
        <p>
          Ingresa para administrar las ventas,
          contratos y cobranzas.
        </p>
      </div>

      <form id="formLogin" class="formulario-login">

        <div class="campo">
          <label for="usuario">Usuario</label>

          <input
            type="text"
            id="usuario"
            placeholder="Ingresa tu usuario"
            autocomplete="username"
            required
          >
        </div>

        <div class="campo">
          <label for="contrasena">Contraseña</label>

          <div class="campo-contrasena">
            <input
              type="password"
              id="contrasena"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
            >

            <button
              type="button"
              id="btnMostrarContrasena"
              class="btn-mostrar"
              aria-label="Mostrar contraseña"
            >
              Ver
            </button>
          </div>
        </div>

        <p id="mensajeLogin" class="mensaje-login"></p>

        <button type="submit" class="btn-ingresar">
          Ingresar
        </button>

      </form>

      <div class="usuarios-aplicacion">

        <div class="usuario-tipo">
          <div class="usuario-icono administrador">A</div>

          <div>
            <strong>Administrador</strong>
            <span>Tu papá administra todo</span>
          </div>
        </div>

        <div class="usuario-tipo">
          <div class="usuario-icono cobrador">G</div>

          <div>
            <strong>Cobrador</strong>
            <span>Gregorio registra los pagos</span>
          </div>
        </div>

      </div>

      <div class="estado-conexion">
        <span class="punto-conexion"></span>
        Sistema disponible
      </div>

    </section>
  </main>
`;

const inputContrasena = document.querySelector("#contrasena");
const btnMostrarContrasena = document.querySelector(
  "#btnMostrarContrasena"
);
const formLogin = document.querySelector("#formLogin");
const mensajeLogin = document.querySelector("#mensajeLogin");

const btnIngresar = document.querySelector(".btn-ingresar");
btnMostrarContrasena.addEventListener("click", () => {
  const estaOculta = inputContrasena.type === "password";

  inputContrasena.type = estaOculta ? "text" : "password";
  btnMostrarContrasena.textContent = estaOculta ? "Ocultar" : "Ver";
});

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const usuario = document
    .querySelector("#usuario")
    .value
    .trim();

  const contrasena = document
    .querySelector("#contrasena")
    .value;

  mensajeLogin.textContent = "";
  mensajeLogin.classList.remove("error");

  btnIngresar.disabled = true;
  btnIngresar.textContent = "Ingresando...";

  try {
    const respuesta = await fetch(
      "http://localhost:8080/api/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          usuario: usuario,
          contrasena: contrasena
        })
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        "Usuario o contraseña incorrectos"
      );
    }

    const datos = await respuesta.json();

    localStorage.setItem(
      "controlventas_token",
      datos.token
    );

    localStorage.setItem(
      "controlventas_usuario",
      JSON.stringify({
        idUsuario: datos.idUsuario,
        nombreCompleto: datos.nombreCompleto,
        rol: datos.rol,
        idCobrador: datos.idCobrador
      })
    );

    mensajeLogin.textContent =
      `Bienvenido, ${datos.nombreCompleto}. ` +
      `Rol: ${datos.rol}`;

    btnIngresar.textContent = "Ingreso correcto";

    setTimeout(() => {
      mostrarInicio(datos);
    }, 600);

  } catch (error) {
    mensajeLogin.textContent = error.message;
    mensajeLogin.classList.add("error");

    btnIngresar.disabled = false;
    btnIngresar.textContent = "Ingresar";
  }
});

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        async () => {

            try {
                const registro =
                    await navigator
                        .serviceWorker
                        .register(
                            "/service-worker.js"
                        );

                console.log(
                    "Service Worker registrado:",
                    registro.scope
                );

            } catch (error) {

                console.error(
                    "No se pudo registrar el Service Worker:",
                    error
                );
            }
        }
    );
}