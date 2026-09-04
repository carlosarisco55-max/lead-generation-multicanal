/**
 * GA4 Lead Capture Snippet — reusable, adaptable a cualquier negocio con GA4 instalado.
 *
 * Qué hace: en el momento en que alguien envía un formulario de contacto/lead,
 * captura el contexto de GA4 (client_id, UTMs, landing page, páginas vistas)
 * y lo añade al payload que se manda al webhook de n8n — sin llamar a ninguna
 * API de GA4, sin coste, sin latencia. Esto es "first-party data" (la más
 * valiosa y resistente al fin de las cookies de terceros).
 *
 * Cómo usarlo:
 * 1. Pega este script en cualquier página con formulario, DESPUÉS del tag de GA4.
 * 2. Antes de enviar el formulario (submit / fetch / XHR), llama a
 *    getGA4LeadContext() y añade el resultado a los datos que mandas al webhook.
 *
 * Ejemplo de uso con un formulario real:
 *
 *   document.querySelector('#lead-form').addEventListener('submit', function (e) {
 *     e.preventDefault();
 *     const formData = {
 *       nombre: document.querySelector('#nombre').value,
 *       email: document.querySelector('#email').value,
 *       telefono: document.querySelector('#telefono').value,
 *       mensaje: document.querySelector('#mensaje').value,
 *       pagina: window.location.pathname,
 *       ...getGA4LeadContext()
 *     };
 *     fetch('https://tu-n8n.com/webhook/lead-organico', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(formData)
 *     });
 *   });
 */

function getGA4LeadContext() {
  return {
    ga_client_id: getGA4ClientId(),
    utm_source: getUrlParam('utm_source') || sessionStorage.getItem('first_utm_source') || '',
    utm_medium: getUrlParam('utm_medium') || sessionStorage.getItem('first_utm_medium') || '',
    utm_campaign: getUrlParam('utm_campaign') || sessionStorage.getItem('first_utm_campaign') || '',
    landing_page: sessionStorage.getItem('landing_page') || window.location.pathname,
    paginas_vistas: Number(sessionStorage.getItem('paginas_vistas') || 1)
  };
}

// Lee el client_id de la cookie _ga (formato: GA1.1.XXXXXXXXXX.YYYYYYYYYY)
// Nos quedamos solo con las dos últimas partes, que es el client_id real.
function getGA4ClientId() {
  const match = document.cookie.match(/_ga=(GA\d\.\d\.\d+\.\d+)/);
  if (!match) return '';
  const parts = match[1].split('.');
  return parts.slice(-2).join('.');
}

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

// --- Persistencia de primer contacto (first-touch attribution) ---
// Se ejecuta una vez al cargar cualquier página del sitio (pégalo también
// en el <head>, o en tu gestor de tags, para que funcione en todas las páginas).
(function trackFirstTouchAndPageViews() {
  if (!sessionStorage.getItem('landing_page')) {
    sessionStorage.setItem('landing_page', window.location.pathname);
  }
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
    const value = getUrlParam(key);
    if (value && !sessionStorage.getItem('first_' + key)) {
      sessionStorage.setItem('first_' + key, value.toLowerCase());
    }
  });
  const currentViews = Number(sessionStorage.getItem('paginas_vistas') || 0);
  sessionStorage.setItem('paginas_vistas', currentViews + 1);
})();
