# Recortes de las tarjetas (card-cutouts)

Genera la versión **sin fondo** de la foto principal de un producto, solo para
su **tarjeta** en el grid (catálogo, home, "También te puede gustar"). La página
de detalle no cambia: muestra siempre la foto original.

## Cuándo hace falta

| Foto principal del producto | Qué pasa en la tarjeta | ¿Usar esta herramienta? |
|---|---|---|
| Fondo blanco | En modo claro el CSS funde el blanco con la tarjeta (`mix-blend-mode` en `output.css`) | No |
| Escena (desierto, frutas, agua, estudio oscuro) o fondo crema/gris | Se ve el recuadro de la foto | **Sí** |

Cuando subas productos nuevos desde el admin, corre `classify`: te dice si hay
fotos que lo necesitan.

## Instalación (una sola vez)

Necesitas **Python 3.12**. Con 3.14, `onnxruntime` todavía no funciona.

```bash
cd tools/card-cutouts
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

La primera vez que corras `masks` se descarga el modelo BiRefNet (~214 MB) en
`.cache/`. El entorno, el modelo y la carpeta `work/` no se suben a git.

## Uso

Todos los comandos se corren desde `tools/card-cutouts/` (en Git Bash, el
ejecutable es `.venv/Scripts/python.exe`):

1. **`python cutouts.py classify`** — lista las fotos principales que necesitan
   recorte y cuáles están **pendientes** (sin decidir). Lee los productos de la
   API de producción.
2. **`python cutouts.py masks`** — calcula la máscara de las pendientes. Es el
   paso **lento**: ~70–90 s por foto en el procesador. Si se corta, vuelve a
   correrlo y sigue donde quedó.
3. **`python cutouts.py compose`** — arma dos versiones de cada foto en `work/`:
   - **full**: todo lo que el modelo detectó.
   - **main**: solo los objetos grandes (botella y caja), sin frutas ni
     adornos sueltos.
4. **`python cutouts.py review`** — genera hojas en `work/review/` con cuatro
   columnas: original · full sobre tarjeta clara · main sobre clara · main
   sobre oscura.
5. **Decide en `decisions.json`**, mirando las hojas:
   - Aprobar → en `approved`: `"<url>": {"name": "...", "variant": "main"}`
     (o `"full"` si la completa se ve mejor).
   - Rechazar → en `rejected`: `"<url>": {"name": "...", "reason": "..."}`.
     La tarjeta sigue usando la foto original.
6. **`python cutouts.py publish`** — copia las aprobadas a
   `ejercicio_web/assets/previews/` y regenera `ejercicio_web/js/cardImages.js`.
   Después, commit y push como siempre.

Opciones de `masks`, `compose` y `review`:
- `--only TEXTO` — filtra por nombre o URL, aunque la foto ya esté decidida.
- `--all` — incluye todas las candidatas, no solo las pendientes.
- `--redo` (solo `masks`) — recalcula aunque ya exista la máscara.

## Criterios de revisión (los usados el 2026-09-26)

- **Aprobar** si el producto queda completo y limpio. Los adornos pegados a la
  botella (frutas, vainilla, un pedestal, un reflejo) se aceptan si se ven
  como una foto de producto armada.
- **Rechazar** si:
  - la caja queda agujereada o se pierde;
  - quedan objetos grandes flotando sueltos;
  - los bordes quedan irregulares (por ejemplo, una caja con cielo impreso).
- **Si la foto original es de fondo blanco** y el recorte pierde algo, recházalo: el
  CSS ya la muestra entera.

## Cómo lo usa el sitio

`ejercicio_web/js/cardImages.js` relaciona la **URL exacta** de la foto
principal en Cloudinary con su recorte. Si cambias la foto de un producto desde
el admin, la URL cambia, deja de coincidir y la tarjeta vuelve sola a la foto
nueva: nunca queda un recorte viejo. `classify` avisa si hay decisiones de fotos
que ya no se usan, para limpiarlas de `decisions.json`.

## Notas técnicas

- **Modelo:** BiRefNet "general lite" (licencia MIT), en ONNX desde las releases
  de rembg (MIT). Se corre con `onnxruntime` directamente.
- **Por qué no `rembg`:** Smart App Control de Windows bloquea una de sus
  dependencias (`numba`, DLL sin firmar).
- **Por qué no la IA de Cloudinary:** se probó. Con las fotos PNG que tienen
  canal alfa devolvía la imagen sin recortar, y cada recorte cuesta 75
  transformaciones del plan.
- **Formato de salida:** WebP con transparencia, recortado al producto,
  centrado con 12% de aire y máximo 700 px (~25 KB cada uno).
- **Resultado reproducible:** con las mismas versiones de `requirements.txt` se
  obtienen exactamente los mismos archivos; se verificó byte a byte contra los
  publicados.
