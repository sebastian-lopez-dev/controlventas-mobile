let eventoInstalacion = null;
let botonInstalar = null;

export function iniciarInstalacionPWA() {

    crearBotonInstalar();

    /*
     * Si la aplicación ya está instalada,
     * no mostramos el botón.
     */
    if (
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches
    ) {
        ocultarBoton();
        return;
    }

    window.addEventListener(
        "beforeinstallprompt",
        (evento) => {

            evento.preventDefault();

            eventoInstalacion = evento;

            mostrarBoton();

            console.log(
                "ControlVentas está disponible para instalar."
            );
        }
    );

    window.addEventListener(
        "appinstalled",
        () => {

            eventoInstalacion = null;

            ocultarBoton();

            console.log(
                "ControlVentas fue instalada correctamente."
            );
        }
    );
}

function crearBotonInstalar() {

    botonInstalar =
        document.querySelector(
            "#btnInstalarAplicacion"
        );

    if (botonInstalar) {
        return;
    }

    botonInstalar =
        document.createElement("button");

    botonInstalar.id =
        "btnInstalarAplicacion";

    botonInstalar.type = "button";

    botonInstalar.className =
        "boton-instalar-app";

    botonInstalar.hidden = true;

    botonInstalar.innerHTML = `
        <span class="icono-instalar">
            ↓
        </span>

        <span>
            Instalar aplicación
        </span>
    `;

    document.body.appendChild(
        botonInstalar
    );

    botonInstalar.addEventListener(
        "click",
        instalarAplicacion
    );
}

async function instalarAplicacion() {

    if (!eventoInstalacion) {
        return;
    }

    botonInstalar.disabled = true;

    eventoInstalacion.prompt();

    const resultado =
        await eventoInstalacion.userChoice;

    if (resultado.outcome === "accepted") {

        console.log(
            "El usuario aceptó instalar ControlVentas."
        );

    } else {

        console.log(
            "El usuario canceló la instalación."
        );
    }

    eventoInstalacion = null;

    ocultarBoton();

    botonInstalar.disabled = false;
}

function mostrarBoton() {

    if (botonInstalar) {
        botonInstalar.hidden = false;
    }
}

function ocultarBoton() {

    if (botonInstalar) {
        botonInstalar.hidden = true;
    }
}