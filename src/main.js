import "./style.css";
import { API_URL } from "./api.js";
import { mostrarInicio } from "./inicio.js";

import {
  iniciarInstalacionPWA
} from "./instalacion.js";

async function configurarPWA() {
  if (import.meta.env.PROD) {
    iniciarInstalacionPWA();
    return;
  }

  if ("serviceWorker" in navigator) {
    const registros =
      await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registros.map((registro) =>
        registro.unregister()
      )
    );
  }

  if ("caches" in window) {
    const nombresCache =
      await window.caches.keys();

    await Promise.all(
      nombresCache.map((nombre) =>
        window.caches.delete(nombre)
      )
    );
  }
}

configurarPWA();

document.querySelector("#app").innerHTML = `
  <main class="pagina-login">
    <section class="login-contenedor">

      <div class="marca">
        <img
          src="/logo.jpg"
          alt="Logo Corazón de Jesús"
          class="marca-logo"
        >

        <div>
          <h2>Corazón de Jesús</h2>
        </div>
      </div>

      <div class="presentacion">
        <h1>Bienvenido</h1>
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

         <p
          id="mensajeLogin"
          class="mensaje-login"
          aria-live="polite"
        ></p>

        <button type="submit" class="btn-ingresar">
          Ingresar
        </button>

      </form>

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
      `${API_URL}/auth/login`,
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

