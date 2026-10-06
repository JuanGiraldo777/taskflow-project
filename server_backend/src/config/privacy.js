/**
 * @file server_backend/src/config/privacy.js
 * @description Versión vigente de la Política de Tratamiento de Datos
 * (ejercicio_web/privacidad.html).
 *
 * La Ley 1581 de 2012 y el Decreto 1377 de 2013 exigen conservar PRUEBA de
 * que cada persona autorizó el tratamiento de sus datos. Por eso, al
 * registrarse (o al aceptar después, si la cuenta es anterior a la
 * política) se guardan en users la fecha (privacy_accepted_at) y esta
 * versión (privacy_policy_version).
 *
 * Si la política cambia de forma importante: actualizar privacidad.html y
 * subir esta versión; a cada usuario se le volverá a pedir que acepte.
 */
const PRIVACY_POLICY_VERSION = "2026-10-06";

module.exports = { PRIVACY_POLICY_VERSION };
