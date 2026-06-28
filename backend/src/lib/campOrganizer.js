// Cliente mínimo para CampOrganizer (sin SDK, mismo estilo que notion.js).
//
// CampOrganizer no tiene API key pública: la única forma de leer datos es
// autenticarse como usuario normal (email + password) y reusar la cookie de
// sesión que el navegador usa, igual que hace la app web.
//
// ESTADO: el endpoint de login (/api/...) todavía no está confirmado — el
// listener de red no llegó a capturar el POST exacto. Lo único confirmado
// por observación directa del tráfico de la app es:
//
//   GET /api/events/sessions/<SESSION_ID>/schedule?view=day&date=YYYY-MM-DD
//   GET /api/events/sessions/<SESSION_ID>/schedule?view=week&date=YYYY-MM-DD
//
// con la cookie de sesión del navegador. SESSION_ID confirmado para el
// programa de Fede: 6a2c16c06a6ca58164af6e57.
//
// Fail-safe: igual que notion.js, si las credenciales no están configuradas
// (o el login falla), las funciones no rompen el flujo principal — solo
// loguean y devuelven { skipped: true }.

const BASE_URL = 'https://my.camporganizer.app';
const SESSION_ID = '6a2c16c06a6ca58164af6e57'; // sesión "Discovery Edition 3" de Fede

// TODO(Fede): confirmar el endpoint/payload real de login. Candidatos más
// probables para un backend Nuxt/Express tipo CampOrganizer (a probar en
// este orden cuando tengamos la captura de red real):
//   POST /api/auth/login        { email, password }
//   POST /api/users/login       { email, password }
//   POST /api/sessions          { email, password }
// Una vez confirmado, actualizar LOGIN_PATH abajo — el resto del archivo no
// debería necesitar cambios.
const LOGIN_PATH = '/api/auth/login';

let cachedCookie = null;
let cachedCookieExpiresAt = 0;
const COOKIE_TTL_MS = 1000 * 60 * 30; // re-login cada 30 min por seguridad

function isConfigured() {
  return Boolean(process.env.CAMP_ORGANIZER_EMAIL && process.env.CAMP_ORGANIZER_PASSWORD);
}

// Hace login y devuelve el header Cookie a usar en requests posteriores.
// Cachea la cookie un rato para no loguear en cada llamada.
async function getSessionCookie() {
  if (!isConfigured()) {
    console.log('[camporganizer] CAMP_ORGANIZER_EMAIL/PASSWORD no configuradas, omito sync');
    return null;
  }

  if (cachedCookie && Date.now() < cachedCookieExpiresAt) {
    return cachedCookie;
  }

  const response = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CAMP_ORGANIZER_EMAIL,
      password: process.env.CAMP_ORGANIZER_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`[camporganizer] login falló: HTTP ${response.status}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('[camporganizer] login OK pero no recibí set-cookie; revisar formato de respuesta');
  }

  // Nos quedamos solo con el par nombre=valor de cada cookie (sin atributos
  // Path/HttpOnly/etc.) para reenviarla como header Cookie.
  cachedCookie = setCookie
    .split(/,(?=[^;]+?=)/) // separa cookies múltiples en un solo header set-cookie
    .map((c) => c.split(';')[0].trim())
    .join('; ');
  cachedCookieExpiresAt = Date.now() + COOKIE_TTL_MS;

  return cachedCookie;
}

// Trae el horario de un día puntual (YYYY-MM-DD). Mismo shape que ve la app.
async function fetchDaySchedule(dateISO) {
  const cookie = await getSessionCookie();
  if (!cookie) return { skipped: true };

  const url = `${BASE_URL}/api/events/sessions/${SESSION_ID}/schedule?view=day&date=${dateISO}`;
  const response = await fetch(url, { headers: { Cookie: cookie } });

  if (!response.ok) {
    throw new Error(`[camporganizer] fetchDaySchedule falló: HTTP ${response.status}`);
  }
  return response.json();
}

// Trae el horario de la semana que contiene esa fecha (YYYY-MM-DD).
async function fetchWeekSchedule(dateISO) {
  const cookie = await getSessionCookie();
  if (!cookie) return { skipped: true };

  const url = `${BASE_URL}/api/events/sessions/${SESSION_ID}/schedule?view=week&date=${dateISO}`;
  const response = await fetch(url, { headers: { Cookie: cookie } });

  if (!response.ok) {
    throw new Error(`[camporganizer] fetchWeekSchedule falló: HTTP ${response.status}`);
  }
  return response.json();
}

module.exports = {
  isConfigured,
  fetchDaySchedule,
  fetchWeekSchedule,
};
