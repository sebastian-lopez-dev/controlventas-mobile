const NOMBRE_CACHE =
    "controlventas-cache-v1";

const ARCHIVOS_INICIALES = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/controlventas-icon.svg",
    "/icon-180.png",
    "/icon-192.png",
    "/icon-512.png",
    "/icon-maskable-512.png"
];

self.addEventListener(
    "install",
    (evento) => {

        evento.waitUntil(
            caches
                .open(NOMBRE_CACHE)
                .then((cache) => {

                    return cache.addAll(
                        ARCHIVOS_INICIALES
                    );
                })
        );

        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    (evento) => {

        evento.waitUntil(
            caches
                .keys()
                .then((nombres) => {

                    return Promise.all(
                        nombres.map(
                            (nombre) => {

                                if (
                                    nombre !==
                                    NOMBRE_CACHE
                                ) {
                                    return caches.delete(
                                        nombre
                                    );
                                }

                                return null;
                            }
                        )
                    );
                })
        );

        self.clients.claim();
    }
);

self.addEventListener(
    "fetch",
    (evento) => {

        const solicitud = evento.request;

        if (solicitud.method !== "GET") {
            return;
        }

        const url = new URL(
            solicitud.url
        );

        /*
         * No guardar en caché:
         * pagos, cobranzas, clientes,
         * contratos ni demás datos de la API.
         */
        if (
            url.pathname.startsWith("/api/") ||
            url.origin !== self.location.origin
        ) {
            return;
        }

        evento.respondWith(
            fetch(solicitud)
                .then((respuesta) => {

                    if (
                        respuesta &&
                        respuesta.ok
                    ) {
                        const copia =
                            respuesta.clone();

                        caches
                            .open(NOMBRE_CACHE)
                            .then((cache) => {

                                cache.put(
                                    solicitud,
                                    copia
                                );
                            });
                    }

                    return respuesta;
                })
                .catch(async () => {

                    const guardado =
                        await caches.match(
                            solicitud
                        );

                    if (guardado) {
                        return guardado;
                    }

                    if (
                        solicitud.mode ===
                        "navigate"
                    ) {
                        return caches.match("/");
                    }

                    return new Response(
                        "Contenido no disponible sin conexión",
                        {
                            status: 503,
                            headers: {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        }
                    );
                })
        );
    }
);