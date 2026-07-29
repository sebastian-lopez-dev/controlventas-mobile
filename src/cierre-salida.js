import { apiFetch } from "./api.js";

export function mostrarCierreSalida(
    salida,
    volverALista
) {
    const detalles = salida.detalles || [];

    document.querySelector("#app").innerHTML = `
        <main class="pagina-movil">

            <header class="encabezado-pagina">
                <button
                    type="button"
                    id="btnVolverCierre"
                    class="btn-volver"
                >
                    ← Volver
                </button>

                <div>
                    <span class="texto-pequeno">
                        CIERRE DE SALIDA
                    </span>

                    <h1>
                        Contar mercadería
                    </h1>
                </div>
            </header>

            <section class="resumen-cierre-salida">

                <p>
                    <strong>Fecha:</strong>
                    ${formatearFecha(salida.fechaSalida)}
                </p>

                <p>
                    <strong>Destino:</strong>
                    ${salida.destino}
                </p>

                <p>
                    Escribe la cantidad física que
                    regresó en el carro.
                </p>

            </section>

            <form id="formCerrarSalida">

                <div class="lista-conteo-productos">

                    ${detalles
                        .map(crearFilaConteo)
                        .join("")}

                </div>

                <div
                    id="mensajeCierreSalida"
                    class="mensaje-formulario"
                ></div>

                <button
                    type="submit"
                    id="btnConfirmarCierre"
                    class="btn-principal"
                >
                    Confirmar y cerrar salida
                </button>

            </form>

        </main>
    `;

    document
        .querySelector("#btnVolverCierre")
        .addEventListener(
            "click",
            volverALista
        );

    document
        .querySelectorAll("[data-conteo]")
        .forEach((input) => {

            input.addEventListener(
                "input",
                () => actualizarDiferencia(input)
            );

            actualizarDiferencia(input);
        });

    document
        .querySelector("#formCerrarSalida")
        .addEventListener(
            "submit",
            async (evento) => {

                evento.preventDefault();

                await cerrarSalida(
                    salida,
                    detalles,
                    volverALista
                );
            }
        );
}

function crearFilaConteo(detalle) {
    const producto = detalle.producto;

    const esperado =
        detalle.stockEsperado ??
        (
            detalle.cantidadCargada -
            detalle.cantidadVendida
        );

    return `
        <article class="tarjeta-conteo">

            <div class="encabezado-producto-conteo">

                <div>
                    <span class="codigo-producto">
                        ${producto.codigo}
                    </span>

                    <h3>
                        ${producto.nombre}
                    </h3>
                </div>

                <span class="stock-esperado">
                    Deben volver: ${esperado}
                </span>

            </div>

            <div class="datos-kardex-cierre">

                <span>
                    Cargado:
                    <strong>
                        ${detalle.cantidadCargada}
                    </strong>
                </span>

                <span>
                    Vendido:
                    <strong>
                        ${detalle.cantidadVendida}
                    </strong>
                </span>

                <span>
                    Esperado:
                    <strong>
                        ${esperado}
                    </strong>
                </span>

            </div>

            <label>
                Cantidad contada físicamente

                <input
                    type="number"
                    min="0"
                    step="1"
                    value="${esperado}"
                    data-conteo="${producto.idProducto}"
                    data-esperado="${esperado}"
                    required
                >
            </label>

            <div
                class="resultado-diferencia"
                data-diferencia="${producto.idProducto}"
            ></div>

            <div
                data-grupo-observacion="${producto.idProducto}"
                hidden
            >
                <label>
                    Explique la diferencia

                    <textarea
                        rows="2"
                        data-observacion="${producto.idProducto}"
                        placeholder="Ejemplo: producto perdido, dañado o entregado sin registrar"
                    ></textarea>
                </label>
            </div>

        </article>
    `;
}

function actualizarDiferencia(input) {
    const idProducto = input.dataset.conteo;

    const esperado = Number(
        input.dataset.esperado
    );

    const contado = Number(input.value);

    const diferencia = contado - esperado;

    const resultado = document.querySelector(
        `[data-diferencia="${idProducto}"]`
    );

    const grupoObservacion =
        document.querySelector(
            `[data-grupo-observacion="${idProducto}"]`
        );

    const observacion = document.querySelector(
        `[data-observacion="${idProducto}"]`
    );

    resultado.className =
        "resultado-diferencia";

    if (diferencia === 0) {

        resultado.textContent =
            "✓ La cantidad coincide";

        resultado.classList.add(
            "diferencia-correcta"
        );

        grupoObservacion.hidden = true;
        observacion.required = false;

        return;
    }

    if (diferencia < 0) {

        resultado.textContent =
            `Faltan ${Math.abs(diferencia)} unidad(es)`;

        resultado.classList.add(
            "diferencia-negativa"
        );

    } else {

        resultado.textContent =
            `Sobran ${diferencia} unidad(es)`;

        resultado.classList.add(
            "diferencia-positiva"
        );
    }

    grupoObservacion.hidden = false;
    observacion.required = true;
}

async function cerrarSalida(
    salida,
    detalles,
    volverALista
) {
    const mensaje = document.querySelector(
        "#mensajeCierreSalida"
    );

    const boton = document.querySelector(
        "#btnConfirmarCierre"
    );

    mensaje.textContent = "";

    const conteos = [];

    for (const detalle of detalles) {
        const idProducto =
            detalle.producto.idProducto;

        const input = document.querySelector(
            `[data-conteo="${idProducto}"]`
        );

        const observacion =
            document.querySelector(
                `[data-observacion="${idProducto}"]`
            );

        const esperado = Number(
            input.dataset.esperado
        );

        const cantidadContada =
            Number(input.value);

        if (
            input.value === "" ||
            cantidadContada < 0 ||
            !Number.isInteger(cantidadContada)
        ) {
            mensaje.textContent =
                "Todas las cantidades deben ser números enteros.";

            mensaje.className =
                "mensaje-formulario mensaje-error";

            input.focus();
            return;
        }

        const diferencia =
            cantidadContada - esperado;

        if (
            diferencia !== 0 &&
            observacion.value.trim() === ""
        ) {
            mensaje.textContent =
                "Debes explicar todas las diferencias.";

            mensaje.className =
                "mensaje-formulario mensaje-error";

            observacion.focus();
            return;
        }

        conteos.push({
            idProducto,
            cantidadContada,
            observaciones:
                observacion.value.trim() || null
        });
    }

    try {
        boton.disabled = true;
        boton.textContent = "Cerrando salida...";

        await apiFetch(
            `/salidas/${salida.idSalida}/cerrar`,
            {
                method: "PUT",
                body: JSON.stringify({
                    conteos
                })
            }
        );

        localStorage.removeItem(
            "controlventas_salida_abierta"
        );

        document.querySelector("#app").innerHTML = `
            <main class="pagina-movil">

                <section class="resultado-exitoso">

                    <div class="icono-exitoso">
                        ✓
                    </div>

                    <h1>
                        Salida cerrada
                    </h1>

                    <p>
                        El conteo fue guardado y la
                        mercadería que regresó volvió
                        automáticamente al stock del almacén.
                    </p>

                    <button
                        type="button"
                        id="btnVolverSalidas"
                        class="btn-principal"
                    >
                        Volver a salidas
                    </button>

                </section>

            </main>
        `;

        document
            .querySelector("#btnVolverSalidas")
            .addEventListener(
                "click",
                volverALista
            );

    } catch (error) {

        mensaje.textContent =
            error.message ||
            "No se pudo cerrar la salida.";

        mensaje.className =
            "mensaje-formulario mensaje-error";

        boton.disabled = false;
        boton.textContent =
            "Confirmar y cerrar salida";
    }
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    return new Date(
        `${fecha}T00:00:00`
    ).toLocaleDateString("es-PE");
}