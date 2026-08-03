import { apiFetch } from "./api.js";
export async function mostrarDetallePrestamo(
    usuario,
    prestamo,
    volverALista
) {
    const cliente = prestamo.cliente || {};

    document.querySelector("#app").innerHTML = `
    <main class="aplicacion-movil">
      <header class="cabecera-pagina">
        <button
          type="button"
          id="btnVolverDetallePrestamo"
          class="btn-volver"
        >
          ‹
        </button>

        <div>
          <h1>
            ${escaparTexto(
        prestamo.numeroPrestamo || "Detalle del préstamo"
    )}
          </h1>

          <p>${escaparTexto(obtenerNombreCliente(cliente))}</p>
        </div>
      </header>

      <section class="contenido-cobranza">
        <article class="tarjeta-cobranza">
          <div class="cobranza-encabezado">
            <div>
              <span class="codigo-cliente">
                ${escaparTexto(
        cliente.codigoCliente || "CLIENTE"
    )}
              </span>

              <h2>
                ${escaparTexto(obtenerNombreCliente(cliente))}
              </h2>
            </div>

            <span class="estado-cuota ${obtenerClaseEstado(
        prestamo.estado
    )}">
              ${escaparTexto(prestamo.estado || "ACTIVO")}
            </span>
          </div>

          <div class="datos-cobranza">
            <div>
              <span>Deuda total</span>
              <strong>
                ${formatearDinero(prestamo.deudaTotal)}
              </strong>
            </div>

            <div>
              <span>Saldo pendiente</span>
              <strong>
                ${formatearDinero(prestamo.saldoPendiente)}
              </strong>
            </div>
          </div>

          <div class="informacion-cliente">
            <p>
              <b>Capital prestado:</b>
              ${formatearDinero(prestamo.montoCapital)}
            </p>

            <p>
              <b>Interés:</b>
              ${Number(prestamo.porcentajeInteres || 0)}%
              (${formatearDinero(prestamo.montoInteres)})
            </p>

            <p>
              <b>Modalidad:</b>
              ${escaparTexto(prestamo.modalidadPago || "No registrada")}
            </p>

            <p>
              <b>Monto de cuota:</b>
              ${formatearDinero(prestamo.montoCuota)}
            </p>

            <p>
              <b>Fecha de desembolso:</b>
              ${formatearFecha(prestamo.fechaDesembolso)}
            </p>

            <p>
              <b>Primer pago:</b>
              ${formatearFecha(prestamo.fechaPrimerPago)}
            </p>

            <p>
              <b>Último vencimiento:</b>
              ${formatearFecha(prestamo.fechaVencimiento)}
            </p>

            ${cliente.dni
            ? `
                  <p>
                    <b>DNI:</b>
                    ${escaparTexto(cliente.dni)}
                  </p>
                `
            : ""
        }

            ${prestamo.observaciones
            ? `
                  <p>
                    <b>Observaciones:</b>
                    ${escaparTexto(prestamo.observaciones)}
                  </p>
                `
            : ""
        }
          </div>

        </article>

        <div class="titulo-seccion">
          <h2>Plan de pagos</h2>
          <p>Cuotas generadas para este préstamo</p>
        </div>

        <div id="listaCuotasPrestamo">
          <div class="estado-cargando">
            <div class="cargador"></div>
            <p>Cargando cuotas...</p>
          </div>
        </div>

      </section>
    </main>
  `;

    document
        .querySelector("#btnVolverDetallePrestamo")
        .addEventListener("click", volverALista);

    try {
        const [cuotas, pagos] = await Promise.all([
            apiFetch(
                `/prestamos/${prestamo.idPrestamo}/cuotas`
            ),
            apiFetch(
                `/prestamos/${prestamo.idPrestamo}/pagos`
            )
        ]);

        renderizarCuotasPrestamo(cuotas);
        renderizarPagosPrestamo(pagos);
    } catch (error) {
        document.querySelector("#listaCuotasPrestamo").innerHTML = `
    <div class="error-cobranza">
      <div>!</div>
      <h2>No se pudo cargar la información</h2>
      <p>${escaparTexto(error.message)}</p>
    </div>
  `;

        const listaPagos = document.querySelector(
            "#listaPagosPrestamo"
        );

        if (listaPagos) {
            listaPagos.innerHTML = "";
        }
    }
}

function renderizarCuotasPrestamo(cuotas) {
    const contenedor = document.querySelector(
        "#listaCuotasPrestamo"
    );

    if (cuotas.length === 0) {
        contenedor.innerHTML = `
      <div class="cobranza-vacia">
        <div>📅</div>
        <h2>No hay cuotas generadas</h2>
        <p>
          Este préstamo todavía no tiene un plan de pagos.
        </p>
      </div>
    `;

        return;
    }

    contenedor.innerHTML = `
    <div class="cantidad-resultados">
      ${cuotas.length}
      ${cuotas.length === 1 ? "cuota" : "cuotas"}
    </div>

    <div class="lista-cobranzas">
      ${cuotas
            .map(
                (cuota) => `
            <article class="tarjeta-cobranza">
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    CUOTA ${cuota.numeroCuota}
                  </span>

                  <h2>
                    Vence:
                    ${formatearFecha(cuota.fechaVencimiento)}
                  </h2>
                </div>

                <span class="estado-cuota ${obtenerClaseEstadoCuota(
                    cuota.estado
                )}">
                  ${escaparTexto(cuota.estado || "PENDIENTE")}
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Monto de cuota</span>
                  <strong>
                    ${formatearDinero(cuota.montoCuota)}
                  </strong>
                </div>

                <div>
                  <span>Saldo pendiente</span>
                  <strong>
                    ${formatearDinero(cuota.saldoPendiente)}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Monto pagado:</b>
                  ${formatearDinero(cuota.montoPagado)}
                </p>
              </div>
            </article>
          `
            )
            .join("")}
    </div>
  `;
}

function renderizarPagosPrestamo(pagos) {
    const contenedor = document.querySelector(
        "#listaPagosPrestamo"
    );

    if (!contenedor) {
        return;
    }

    if (pagos.length === 0) {
        contenedor.innerHTML = `
      <div class="cobranza-vacia">
        <div>💵</div>
        <h2>No hay pagos registrados</h2>
        <p>
          Los pagos realizados aparecerán aquí.
        </p>
      </div>
    `;

        return;
    }

    contenedor.innerHTML = `
    <div class="cantidad-resultados">
      ${pagos.length}
      ${pagos.length === 1 ? "pago registrado" : "pagos registrados"}
    </div>

    <div class="lista-cobranzas">
      ${pagos
            .map(
                (pago) => `
            <article class="tarjeta-cobranza">
              <div class="cobranza-encabezado">
                <div>
                  <span class="codigo-cliente">
                    PAGO
                  </span>

                  <h2>
                    ${formatearFecha(pago.fechaPago)}
                  </h2>
                </div>

                <span class="estado-cuota pagada">
                  PAGADO
                </span>
              </div>

              <div class="datos-cobranza">
                <div>
                  <span>Monto pagado</span>
                  <strong>
                    ${formatearDinero(pago.montoPago)}
                  </strong>
                </div>

                <div>
                  <span>Saldo posterior</span>
                  <strong>
                    ${formatearDinero(pago.saldoPosterior)}
                  </strong>
                </div>
              </div>

              <div class="informacion-cliente">
                <p>
                  <b>Saldo anterior:</b>
                  ${formatearDinero(pago.saldoAnterior)}
                </p>

                ${pago.observaciones
                        ? `
                      <p>
                        <b>Observaciones:</b>
                        ${escaparTexto(pago.observaciones)}
                      </p>
                    `
                        : ""
                    }
              </div>
            </article>
          `
            )
            .join("")}
    </div>
  `;
}

function obtenerNombreCliente(cliente) {
    const nombre = [
        cliente.nombres,
        cliente.apellidoPaterno,
        cliente.apellidoMaterno
    ]
        .filter(Boolean)
        .join(" ");

    return nombre || "Cliente";
}

function obtenerClaseEstado(estado) {
    const valor = String(estado || "").toUpperCase();

    if (valor === "FINALIZADO") {
        return "pagada";
    }

    if (valor === "VENCIDO") {
        return "vencida";
    }

    return "pendiente";
}

function obtenerClaseEstadoCuota(estado) {
    const valor = String(estado || "").toUpperCase();

    if (valor === "PAGADA") {
        return "pagada";
    }

    if (valor === "PARCIAL") {
        return "parcial";
    }

    if (valor === "VENCIDA") {
        return "vencida";
    }

    return "pendiente";
}

function formatearDinero(valor) {
    return Number(valor || 0).toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN"
    });
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "No registrada";
    }

    return new Date(`${fecha}T00:00:00`).toLocaleDateString(
        "es-PE"
    );
}

function escaparTexto(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}