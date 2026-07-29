import sharp from "sharp";
import path from "node:path";
import {
    fileURLToPath
} from "node:url";

const archivoActual = fileURLToPath(
    import.meta.url
);

const carpetaProyecto = path.dirname(
    archivoActual
);

const iconoOriginal = path.join(
    carpetaProyecto,
    "public",
    "controlventas-icon.svg"
);

const carpetaPublic = path.join(
    carpetaProyecto,
    "public"
);

await Promise.all([

    sharp(iconoOriginal)
        .resize(180, 180)
        .png()
        .toFile(
            path.join(
                carpetaPublic,
                "icon-180.png"
            )
        ),

    sharp(iconoOriginal)
        .resize(192, 192)
        .png()
        .toFile(
            path.join(
                carpetaPublic,
                "icon-192.png"
            )
        ),

    sharp(iconoOriginal)
        .resize(512, 512)
        .png()
        .toFile(
            path.join(
                carpetaPublic,
                "icon-512.png"
            )
        ),

    sharp(iconoOriginal)
        .resize(410, 410)
        .extend({
            top: 51,
            bottom: 51,
            left: 51,
            right: 51,
            background: {
                r: 37,
                g: 99,
                b: 235,
                alpha: 1
            }
        })
        .png()
        .toFile(
            path.join(
                carpetaPublic,
                "icon-maskable-512.png"
            )
        )
]);

console.log(
    "Íconos de ControlVentas generados correctamente."
);