// Clima en tiempo real (no es el pronóstico cacheado de CampOrganizer, que
// solo se sincroniza una vez por día ~6:30 AM). Usa Open-Meteo: API pública,
// sin key, CORS-friendly, ideal para llamar directo desde el frontend.
// https://open-meteo.com/en/docs

export const WEEK1_START = new Date('2026-06-28');
export const WEEK2_START = new Date('2026-07-05');

export const LOCATIONS = {
  Segovia: { lat: 40.9429, lon: -4.1088 },
  Madrid: { lat: 40.4168, lon: -3.7038 },
};

// Misma lógica de semana/ubicación que usa Dashboard.jsx para el badge
// "Semana X — Ciudad" — centralizada aquí para que el widget de clima en
// vivo (Dashboard y CampOrganizer) siempre mire la misma ciudad.
export function getCurrentWeek(now = new Date()) {
  if (now >= WEEK1_START && now < WEEK2_START) return 1;
  if (now >= WEEK2_START) return 2;
  return null;
}

export function getCurrentLocation(now = new Date()) {
  const w = getCurrentWeek(now);
  if (w === 1) return 'Segovia';
  if (w === 2) return 'Madrid';
  // Antes de que arranque el programa, mostramos el clima de la primera
  // ciudad (Segovia) en vez de no mostrar nada.
  return 'Segovia';
}

// Códigos WMO (weather_code de Open-Meteo) → etiqueta en español + nombre
// de ícono de lucide-react. No es exhaustivo, cubre los casos comunes.
const WMO_MAP = {
  0: { label: 'Despejado', icon: 'Sun' },
  1: { label: 'Mayormente despejado', icon: 'CloudSun' },
  2: { label: 'Parcialmente nublado', icon: 'CloudSun' },
  3: { label: 'Nublado', icon: 'Cloud' },
  45: { label: 'Niebla', icon: 'CloudFog' },
  48: { label: 'Niebla helada', icon: 'CloudFog' },
  51: { label: 'Llovizna ligera', icon: 'CloudDrizzle' },
  53: { label: 'Llovizna', icon: 'CloudDrizzle' },
  55: { label: 'Llovizna intensa', icon: 'CloudDrizzle' },
  56: { label: 'Llovizna helada', icon: 'CloudDrizzle' },
  57: { label: 'Llovizna helada intensa', icon: 'CloudDrizzle' },
  61: { label: 'Lluvia ligera', icon: 'CloudRain' },
  63: { label: 'Lluvia', icon: 'CloudRain' },
  65: { label: 'Lluvia intensa', icon: 'CloudRain' },
  66: { label: 'Lluvia helada', icon: 'CloudRain' },
  67: { label: 'Lluvia helada intensa', icon: 'CloudRain' },
  71: { label: 'Nieve ligera', icon: 'CloudSnow' },
  73: { label: 'Nieve', icon: 'CloudSnow' },
  75: { label: 'Nieve intensa', icon: 'CloudSnow' },
  77: { label: 'Granizo', icon: 'CloudSnow' },
  80: { label: 'Chubascos ligeros', icon: 'CloudRain' },
  81: { label: 'Chubascos', icon: 'CloudRain' },
  82: { label: 'Chubascos intensos', icon: 'CloudRain' },
  85: { label: 'Chubascos de nieve', icon: 'CloudSnow' },
  86: { label: 'Chubascos de nieve intensos', icon: 'CloudSnow' },
  95: { label: 'Tormenta', icon: 'CloudLightning' },
  96: { label: 'Tormenta con granizo', icon: 'CloudLightning' },
  99: { label: 'Tormenta con granizo intenso', icon: 'CloudLightning' },
};

export function getWeatherInfo(code) {
  return WMO_MAP[code] || { label: 'Clima', icon: 'Cloud' };
}

// Trae el clima actual (no un pronóstico) para la ciudad dada ('Segovia' o
// 'Madrid'). Lanza si la API falla — el caller decide cómo mostrar el error.
export async function fetchCurrentWeather(locationName) {
  const loc = LOCATIONS[locationName] || LOCATIONS.Segovia;
  const params = new URLSearchParams({
    latitude: loc.lat,
    longitude: loc.lon,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
    timezone: 'Europe/Madrid',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
  const json = await res.json();
  const c = json.current;
  return {
    tempC: c.temperature_2m,
    feelsLike: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windKmh: c.wind_speed_10m,
    code: c.weather_code,
    time: c.time,
    location: locationName,
  };
}
