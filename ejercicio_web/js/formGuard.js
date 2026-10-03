/**
 * @file ejercicio_web/js/formGuard.js
 * @description Protección invisible contra bots y doble envío en formularios públicos.
 *
 * El backend (server_backend/src/middlewares/antiSpam.js) rechaza el
 * registro y las reseñas si:
 * - el campo trampa "website" llega con algo escrito (las personas no lo
 *   ven, los bots que rellenan todo sí lo rellenan), o
 * - el formulario se envió menos de 2 s después de mostrarse.
 *
 * Uso: meter HONEYPOT_HTML dentro del <form>, llamar armForm(form) al
 * mostrarlo y mandar {...antiSpamFields(form)} junto con los datos.
 */

// Fuera de la pantalla (no display:none, que algunos bots detectan),
// oculto para lectores de pantalla y fuera del orden del tabulador.
export const HONEYPOT_HTML = `
  <div aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden">
    <label>No completes este campo
      <input type="text" name="website" tabindex="-1" autocomplete="off" value="" />
    </label>
  </div>
`;

const shownAt = new WeakMap();

/** Marca el momento en que el formulario se mostró. */
export function armForm(form) {
  if (form) shownAt.set(form, Date.now());
}

/** Campos que el backend espera junto con los datos del formulario. */
export function antiSpamFields(form) {
  const start = shownAt.get(form) ?? Date.now();
  return {
    website: form?.querySelector('input[name="website"]')?.value || "",
    formElapsedMs: Date.now() - start,
  };
}

/**
 * Desactiva el botón mientras se envía: evita reseñas o cuentas
 * duplicadas por doble clic y muestra que algo está pasando.
 */
export async function withSubmitLock(button, task) {
  if (button?.disabled) return undefined;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.style.opacity = "0.6";
  }
  try {
    return await task();
  } finally {
    if (button) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.style.opacity = "";
    }
  }
}
