# PROMPT DE CONTINUACIÓN — IE Dashboard (Telegram Bot + Agentes IA)

> Pega este documento completo como primer mensaje a Kimi, ChatGPT/Codex, o cualquier otro asistente de código para que continúe el proyecto exactamente donde quedó, sin perder contexto.

## Contexto del proyecto

Soy Fede (federicoeckardtd@gmail.com), estudiante que va al IE University Summer School 2026 (Segovia → Madrid, 28 jun – 11 jul 2026). Tengo un dashboard web personal para organizar clases, notas, contactos y reflexiones del programa, con 8 agentes de IA que me mandan mensajes por Telegram.

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
   - Express + node-cron, 8 jobs: Morning Intelligence (7:00 AM), Pre-Class Prep (checa cada 5 min si hay clase en ~30 min), Hackathon Assistant (toma el lugar de Pre-Class Prep en clases del subject `hackathon`), Pitch Practice Bot (idem para subject `pitch`), Night Deepdive (9:00 PM), Networking Icebreaker (12:30 PM diario, antes del almuerzo), Weekend Recap (domingos 6:00 PM), Contact Follow-up (10:30 PM diario, revisa contactos nuevos de las últimas 24h).
   - Hackathon Assistant y Pitch Practice Bot NO son cron jobs aparte — viven dentro de `preClassPrep.js` (`SPECIALIZED_AGENTS` map por `subjectId`), así que comparten el mismo check de "30 min antes" y el mismo dedup de Supabase, pero generan un mensaje distinto (prompts en `deepseek.js`: `hackathonPrep`, `pitchPrep`).
   - Networking Icebreaker (`jobs/networkingIcebreaker.js`) sí es su propio cron job — no depende de que haya notas/contactos nuevos (a diferencia de Contact Follow-up), porque el objetivo es dar un empujón ANTES de la próxima interacción social, no después.
   - Generación de texto vía DeepSeek API, contexto desde Supabase, envío vía Telegram Bot API.
   - Dedup de Pre-Class Prep (incluye Hackathon/Pitch) persistido en Supabase (tabla `preclass_notifications`) — sobrevive reinicios de Railway.
   - URL pública: https://ie-dashboard-production.up.railway.app — endpoints de prueba manual: `/test/morning`, `/test/deepdive`, `/test/preclass`, `/test/weekend`, `/test/contacts`, `/test/networking`.
   - Verificado end-to-end con datos reales en Supabase (notas + reflexión de prueba insertadas y luego limpiadas): `/test/deepdive`, `/test/weekend` y `/test/morning` corrieron sin error generando mensajes a partir de contenido real, no solo el fallback de "sin datos". Networking Icebreaker y Contact Follow-up están deployados pero aún no probados con datos reales — el programa no ha empezado (arranca 28 jun 2026).
7. **Las 28 clases del programa están sincronizadas como eventos en el Google Calendar de Fede** (con horarios estimados, ubicación y subject) — ver sección de pendientes abajo sobre por qué hay que recrearlos cuando se confirme el horario real.
8. **Notion Hub creado** como espejo/backup del dashboard (notas, reflexiones, contactos, tabla de los 8 agentes): https://app.notion.com/p/387470a1dd018192b7bdc6fca1cb91f1 — el sync ya **no es solo manual**: hay una tarea programada de Claude (`ie-notion-weekly-sync`, domingos 7:00 PM hora local) que lee Supabase y actualiza la página automáticamente cada semana. Sigue siendo Claude quien escribe (no el backend de Railway directamente), pero ya no requiere que Fede lo pida cada vez. Para que el backend mismo escriba en Notion sin pasar por Claude haría falta un `NOTION_API_KEY` (ver sección de pendientes) — opcional, no urgente mientras la tarea programada funcione.
9. Todo pusheado a GitHub (`main`).
10. **Pase de diseño/UI mobile** (local, no pusheado aún): el frontend usa estilos inline en todas las páginas, así que se agregó un puente de clases utilitarias globales en `src/index.css` (`@media (max-width: 768px)` con `!important`): `.app-sidebar`/`.app-main` convierten la sidebar fija en una tab bar inferior en pantallas chicas, `.page-pad` reduce el padding, `.responsive-grid` colapsa grids multi-columna a 1 columna, `.modal-card` limita el ancho de modales, `.stack-mobile` apila headers flex. Aplicado en Dashboard, Schedule, Clases (ambas vistas), Contactos, Reflexiones, Mi Perfil, Agentes y Checklist.
11. **Página `/checklist`** (`src/pages/Checklist.jsx`, local, no pusheada aún): checklist pre-viaje con 4 secciones (documentos, equipaje, dinero/conectividad, mentalidad), progreso guardado en `localStorage`. Agregada al navbar.
12. **Fotos de notas a mano / Apple Notes / Freeform** (local, no pusheado aún): en `/clases/:id` ahora hay un uploader real de fotos (antes decía "coming soon"). Las fotos se suben al bucket público de Supabase Storage `note-photos` (creado vía migración + políticas RLS de storage.objects para select/insert/delete) y sus URLs se guardan en la nueva columna `notes.photo_urls` (jsonb). Helpers en `src/lib/supabase.js`: `uploadNotePhoto(classId, file)` y `saveNotePhotos(classId, photoUrls)`. Esquema actualizado en `supabase_setup.sql` para que quede documentado si se recrea la DB desde cero.

## Pendiente inmediato: pushear los cambios de esta sesión

Los puntos 10, 11 y 12 de arriba (mobile responsiveness, `/checklist`, fotos de notas) están hechos y verificados (build compila, migraciones de Supabase ya aplicadas) pero **solo en local** — no se han commiteado ni pusheado. Desde la carpeta del proyecto:

```
git add -A
git commit -m "Mobile responsiveness, checklist pre-viaje, y fotos de notas (papel/Apple Notes/Freeform)"
git push
```

Vercel debería redeployar automáticamente al pushear a `main`.

## Único pendiente real

### Horarios de clase reales (`SESSION_START_TIMES`)

`backend/src/data/schedule.js` y `src/data/schedule.js` tienen `CLASSES` con `day`, `week`, `session` (número), pero el mapa `SESSION_START_TIMES` usa horarios **estimados** (bloques estándar desde las 9:00) porque el horario real del programa no se había confirmado. Esto afecta directamente la precisión de Pre-Class Prep (dispara "30 min antes" del horario estimado, no el real).

**Acción**: en cuanto Fede confirme el horario real, actualizar `SESSION_START_TIMES` en AMBOS archivos (frontend y backend deben quedar sincronizados) — o, mejor, agregar un campo `startTime` directo a cada clase en `CLASSES` si los horarios no son uniformes por número de sesión. También hay que borrar y recrear los 28 eventos del Google Calendar de Fede (creados con estos horarios estimados) una vez se sepa la hora real — no hay sincronización automática entre `schedule.js` y el calendario, así que un cambio en el código no actualiza los eventos ya creados.

Búsqueda web hecha (jun 2026): no existe públicamente un horario hora-por-hora del programa, solo la estructura día-por-día (confirmada y ya reflejada en `CLASSES`: semana 1 Segovia = team formation, design thinking, community building, sustainability, critical thinking; semana 2 Madrid = customer discovery/hackathon kick-off, ideación/prototipado, storytelling/pitch VR, hackathon final + pitch, admisiones + graduación). El horario real hora a hora lo da IE al llegar, como ya sabía Fede.

### Notion Sync — automatización pendiente (opcional)

El Hub de Notion (link arriba) ya se actualiza solo cada semana vía una tarea programada de Claude (`ie-notion-weekly-sync`, domingos 7:00 PM). Si en algún momento se quiere que el backend de Railway escriba ahí directamente (sin pasar por Claude):

1. Crear una integración de Notion y conseguir su token.
2. Compartir la página del Hub con esa integración.
3. Agregar `NOTION_API_KEY` y el ID de la página (`387470a1dd018192b7bdc6fca1cb91f1`) como variables de entorno en Railway.
4. Extender `weekendRecap.js` (o un job nuevo) para hacer `PATCH` a la Notion API con el resumen semanal, notas y contactos.

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
2. `src/lib/agents.js` (frontend) duplica la lógica de prompts de DeepSeek que ahora vive server-side en `backend/src/lib/deepseek.js` (incluye `hackathonPrep`, `pitchPrep`, `contactFollowup` además de los 3 agentes originales). Se usa solo para los botones de prueba manual en `/agentes` (ahora los 4 agentes con datos de ejemplo simples tienen botón "Probar ahora": Morning, Hackathon, Pitch, Contacts — Pre-Class Prep, Night Deepdive y Weekend Recap no, porque necesitan contexto real de Supabase que no tiene sentido simular en el cliente) — no es un bug, pero si se reescriben los prompts hay que actualizar ambos lados.

## Archivos clave para orientarse rápido

- `src/App.js` — rutas: `/`, `/schedule`, `/clases`, `/clases/:id`, `/contactos`, `/agentes`, `/reflexiones`, `/checklist`, `/perfil`.
- `src/data/schedule.js` / `backend/src/data/schedule.js` — fuente de verdad de `SUBJECTS` (8) y `CLASSES` (28). Deben mantenerse sincronizados.
- `backend/src/index.js` — entrypoint del backend, define los cron jobs y las rutas de test manual.
- `backend/src/jobs/` — lógica de cada agente (morningIntelligence, nightDeepdive, preClassPrep [incluye Hackathon Assistant y Pitch Practice Bot], weekendRecap, contactFollowup).
- `backend/src/lib/` — clientes de DeepSeek, Supabase y Telegram.
- `src/pages/Agentes.jsx` — UI de los 8 agentes en el dashboard.

## Primer paso recomendado al continuar

1. Confirmar con Fede el horario real de clases para corregir `SESSION_START_TIMES`.
2. Cualquier otra mejora (UI, nuevos agentes, etc.) puede avanzar en paralelo sin bloqueos — el proyecto está 100% funcional en producción.
