## Ejemplo 1 — Autocompletado con comentarios

**Qué hice:** Escribí un comentario explicando que quería separar la lógica de navegación, slider, búsqueda, carrito y modo oscuro en módulos diferentes dentro de `ejercicio_web`.
**Qué sugirió Cursor:** Propuso crear funciones de inicialización (`initNav`, `initSlider`, `initSearch`, `initCart`, `initThemeToggle`) y un archivo `app.js` que solo las orquesta.
**Tuve que modificarlo:** No — la estructura propuesta encajaba directamente con el HTML existente.
**Conclusión:** Aprendí que describir en un comentario la intención de arquitectura (no solo “haz un refactor”) ayuda a que el autocompletado genere módulos bien separados y reutilizables.

## Ejemplo 2 — Chat contextual

**Qué pregunté:** “Refactoriza app.js y que en unos nuevos archivos js para buenas practicas y separar logica segun las funcionalidades @ejercicio_web/”.
**Qué respondió:** Analizó `index.html` y `app.js` y describió qué hacía cada bloque (navbar, slider, filtro de productos, carrito, dark mode) antes de proponer la separación en módulos.
**Diferencia vs ChatGPT normal:** Conocía mi código real, reutilizó mis selectores y estructura de DOM sin inventar elementos y mantuvo el mismo comportamiento funcional.
**Conclusión:** Vi claro que el chat contextual de Cursor es mucho más seguro para refactors porque trabaja sobre el código real del repo en lugar de soluciones genéricas.

## Ejemplo 3 — Edición inline (Ctrl+K)

**Qué seleccioné:** Fragmentos de lógica mezclada en `app.js` (búsqueda, carrito y dark mode) para reemplazarlos por inicializaciones más limpias.
**Instrucción que di:** “Extrae esta lógica a módulos separados y deja aquí solo las llamadas de inicialización”.
**Qué modificó:** Reemplazó el bloque grande de código por imports desde módulos y llamadas a `init*`, manteniendo la firma de los elementos del DOM.
**Revisé el diff:** Sí
**Acepté todo:** Sí — porque el diff era acotado al archivo y se veía claramente qué se eliminaba y qué se importaba.

## Ejemplo 4 — Composer (Ctrl+Shift+I)

**Instrucción que di:** “Mete todos los js dentro de la carpeta js @ejercicio_web/”.
**Archivos que modificó:** `index.html`, `ejercicio_web/js/app.js`, `ejercicio_web/js/nav.js`, `ejercicio_web/js/slider.js`, `ejercicio_web/js/search.js`, `ejercicio_web/js/cart.js`, `ejercicio_web/js/theme.js`.
**Coherencia entre archivos:** Sí
**Revisé el diff de cada archivo:** Sí
**Diferencia vs Ctrl+K:** Composer gestionó la creación de varios archivos a la vez, actualizó la ruta del `<script>` en el HTML y luego limpió los antiguos `.js` de la raíz, algo que con Ctrl+K habría requerido varios pasos manuales.

## Atajos de teclado más usados

| Atajo | Herramienta | Scope |
|---|---|---|
| `Tab` / `Ctrl+Space` | Autocompletado | Una línea |
| `Ctrl+K` | Edición inline | Un fragmento seleccionado |
| `Ctrl+L` | Chat contextual | Pregunta sobre el código |
| `Ctrl+Shift+I` | Composer | Varios archivos a la vez |

## Ejemplos donde Cursor mejoró mi código

### Ejemplo 1 — Refactor de `app.js` en módulos

**Qué había antes:** Toda la lógica de la página (`navbar`, slider, filtro de búsqueda, carrito con `localStorage` y dark mode) estaba en un solo archivo `app.js` en la raíz de `ejercicio_web`.
**Qué hizo Cursor:** Separó la lógica en cinco módulos (`nav.js`, `slider.js`, `search.js`, `cart.js`, `theme.js`) y convirtió `app.js` en un orquestador que solo importa y ejecuta las funciones `init*`.
**Beneficio:** El código quedó más legible, cada funcionalidad es más fácil de mantener y probar, y se evita tener un archivo “god file” con todo mezclado.

### Ejemplo 2 — Organización de JS en carpeta dedicada

**Qué había antes:** Los archivos JavaScript (`app.js`, `nav.js`, `slider.js`, `search.js`, `cart.js`, `theme.js`) vivían sueltos en la raíz de `ejercicio_web`, mezclados con el HTML y otros recursos.
**Qué hizo Cursor:** Creó la carpeta `ejercicio_web/js/`, movió la lógica a `js/app.js` y módulos dentro de `js/`, actualizó el `<script type="module" src="js/app.js">` en `index.html` y eliminó los JS antiguos de la raíz.
**Beneficio:** La estructura del proyecto es más clara (HTML en la raíz, CSS en `src/`, JS en `js/`), lo que facilita navegar el código y seguir buenas prácticas de organización en proyectos frontend.

