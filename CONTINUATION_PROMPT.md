# PROMPT DE CONTINUACIÓN — IE Dashboard (Telegram Bot + Agentes IA)

> Pega este documento completo como primer mensaje a Kimi, ChatGPT/Codex, o cualquier otro asistente de código para que continúe el proyecto exactamente donde quedó, sin perder contexto.

## Contexto del proyecto

Soy Fede (federicoeckardtd@gmail.com), estudiante que va al IE University Summer School 2026 (Segovia → Madrid, 28 jun – 11 jul 2026). Tengo un dashboard web personal para organizar clases, notas, contactos y reflexiones del programa, con 3 agentes de IA que me mandan mensajes por Telegram.

- **Frontend en vivo**: https://ie-dashboard-ecru.vercel.app
- **Backend en vivo**: https://ie-dashboard-production.up.railway.app
- **Repo GitHub**: https://github.com/feckardtd/ie-dashboard
- **Carpeta local**: `~/Downloads/ie-project/ie-dashboard`
- **Stack**: React (Create React App) + React Router v6 (frontend, Vercel) · Node.js + Express + node-cron (backend, Railway) · Supabase (DB) · DeepSeek API (generación de texto) · Telegram Bot API (mensajería).

## Estado actual — TODO COMPLETADO (PASO 1-5 + backend)

1. Supabase configurado con tablas `notes`, `contacts`, `reflections` (con RLS), más `preclass_notifications` (dedup del agente Pre-Class Prep) — todo verificado funcionando end-to-end.
2. Frontend deployado en Vercel, build limpio.
3. Auditoría completa de las 6 páginas (Dashboard, Clases, Contactos, Agentes, Reflexiones, Mi Perfil) — todas funcionan.
4. Página `/schedule`: calendario visual semanal (`src/pages/Schedule.jsx`), tabs Semana 1 (Segovia) / Semana 2 (Madrid), leyenda de colores por subject.
5. Navbar con link a Schedule.
6. **Backend de Telegram + DeepSeek + Supabase deployado en Railway** (`backend/`):
   - Express + node-cron, 4 jobs: Morning Intelligence (7:00 AM), Night Deepdive (9:00 PM), Pre-Class Prep (checa cada 5 min si hay clase en ~30 min), Weekend Recap (domingos 6:00 PM).
   - Generación de texto vía DeepSeek API, contexto desde Supabase, envío vía Telegram Bot API.
   - Dedup de Pre-Class Prep persistido en Supabase (tabla `preclass_notifications`) — sobrevive reinicios de Railway.
   - URL pública: https://ie-dashboard-production.up.railway.app — endpoints de prueba manual: `/test/morning`, `/test/deepdive`, `/test/preclass`, `/test/weekend`.
   - Verificado end-to-end: Morning/Deepdive/Pre-Class probados en producción con mensajes confirmados recibidos en Telegram. Weekend Recap está deployado pero todavía no se probó manualmente — correr `/test/weekend` para verificar (puede dar el mensaje "sin datos esta semana" si todavía no hay notas/reflexiones guardadas).
7. **Las 28 clases del programa están sincronizadas como eventos en el Google Calendar de Fede** (con horarios estimados, ubicación y subject) — ver sección de pendientes abajo sobre por qué hay que recrearlos cuando se confirme el horario real.
8. Todo pusheado a GitHub (`main`).

## Único pendiente real

### Horarios de clase reales (`SESSION_START_TIMES`)

`backend/src/data/schedule.js` y `src/data/schedule.js` tienen `CLASSES` con `day`, `week`, `session` (número), pero el mapa `SESSION_START_TIMES` usa horarios **estimados** (bloques estándar desde las 9:00) porque el horario real del programa no se había confirmado. Esto afecta directamente la precisión de Pre-Class Prep (dispara "30 min antes" del horario estimado, no el real).

**Acción**: en cuanto Fede confirme el horario real, actualizar `SESSION_START_TIMES` en AMBOS archivos (frontend y backend deben quedar sincronizados) — o, mejor, agregar un campo `startTime` directo a cada clase en `CLASSES` si los horarios no son uniformes por número de sesión. También hay que borrar y recrear los 28 eventos del Google Calendar de Fede (creados con estos horarios estimados) una vez se sepa la hora real — no hay sincronización automática entre `schedule.js` y el calendario, así que un cambio en el código no actualiza los eventos ya creados.

## Notas de arquitectura (decisiones ya tomadas — no reabrir sin razón de peso)

- **NO usar OpenClaw ni frameworks de agentes autónomos** (Hermes Agent, PicoClaw, NanoClaw, AutoGPT, CrewAI, etc.). Son 3 jobs deterministas con cron, no agentes con razonamiento multi-paso.
- El cliente Supabase del backend (`backend/src/lib/supabase.js`) pasa `realtime: { transport: ws }` explícitamente — sin esto, `@supabase/supabase-js` crashea en Node < 22 al intentar inicializar su RealtimeClient (necesita WebSocket nativo o el paquete `ws`). Si se actualiza la dependencia de supabase-js, revisar si este workaround sigue siendo necesario.
- En Railway, el **Target Port** de la red pública debe coincidir con el puerto real en el que escucha la app (Railway inyecta su propio `PORT` vía variable de entorno — confirmar con los logs de deploy, no asumir 3000).
- Root Directory del servicio Railway está en `/backend` (monorepo: frontend en la raíz, backend en `backend/`).

## Variables de entorno (Railway, ya configuradas)

Las 5 variables (`DEEPSEEK_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) ya están seteadas en Railway → Variables. No se repiten aquí en texto plano por seguridad (GitHub bloquea pushes con secretos). Ver `backend/.env.example` para los nombres exactos esperados, y pedirle los valores a Fede directamente si hace falta reconfigurar Railway desde cero.

(Railway también inyecta su propio `PORT` automáticamente — no hace falta configurarlo a mano.)

## Bugs / inconsistencias conocidas (no bloqueantes)

1. Las fechas de Semana 1 / Semana 2 están unificadas entre `Dashboard.jsx`, `Reflexiones.jsx`, `Schedule.jsx` y `backend/src/data/schedule.js` (Semana 1: domingo 28 jun → sábado 4 jul; Semana 2: domingo 5 jul → sábado 11 jul). Si Fede pide cambiar fechas, actualizar los 4 archivos a la vez.
2. `src/lib/agents.js` (frontend) duplica la lógica de prompts de DeepSeek que ahora vive server-side en `backend/src/lib/deepseek.js`. Se usa solo para un botón de prueba manual en `/agentes` — no es un bug, pero si se reescriben los prompts hay que actualizar ambos lados.

## Archivos clave para orientarse rápido

- `src/App.js` — rutas: `/`, `/schedule`, `/clases`, `/clases/:id`, `/contactos`, `/agentes`, `/reflexiones`, `/perfil`.
- `src/data/schedule.js` / `backend/src/data/schedule.js` — fuente de verdad de `SUBJECTS` (8) y `CLASSES` (28). Deben mantenerse sincronizados.
- `backend/src/index.js` — entrypoint del backend, define los 3 cron jobs y las rutas de test manual.
- `backend/src/jobs/` — lógica de cada agente (morningIntelligence, nightDeepdive, preClassPrep).
- `backend/src/lib/` — clientes de DeepSeek, Supabase y Telegram.
- `src/pages/Agentes.jsx` — UI de los 3 agentes en el dashboard.

## Primer paso recomendado al continuar

1. Confirmar con Fede el horario real de clases para corregir `SESSION_START_TIMES`.
2. Cualquier otra mejora (UI, nuevos agentes, etc.) puede avanzar en paralelo sin bloqueos — el proyecto está 100% funcional en producción.
