# IE Dashboard

Dashboard personal para el IE University Summer School 2026 (Segovia → Madrid, 28 jun – 11 jul 2026). Organiza clases, notas, contactos y reflexiones, y manda mensajes automáticos por Telegram generados por 7 agentes de IA.

- **App en vivo**: https://ie-dashboard-ecru.vercel.app
- **Backend (bot de Telegram)**: https://ie-dashboard-production.up.railway.app

## Stack

- **Frontend**: React (Create React App) + React Router v6, deployado en Vercel.
- **Backend**: Node.js + Express + node-cron, deployado en Railway.
- **Base de datos**: Supabase (notas, contactos, reflexiones, dedup de notificaciones).
- **IA**: DeepSeek API (chat completions) para generar los mensajes de los agentes.
- **Mensajería**: Telegram Bot API.

## Agentes

| Agente | Cuándo | Qué hace |
|---|---|---|
| 🌅 Morning Intelligence | 7:00 AM hora España, todos los días | Resume las notas de ayer + conecta con las clases de hoy |
| 📚 Pre-Class Prep | 30 min antes de cada clase | Busca notas pasadas del subject y prepara contexto |
| ⚡ Hackathon Assistant | 30 min antes de clases de hackathon | Prep táctica modo builder (reemplaza a Pre-Class Prep en esas clases) |
| 🎤 Pitch Practice Bot | 30 min antes de clases de pitch | Simula preguntas de jurado (reemplaza a Pre-Class Prep en esas clases) |
| 🌙 Night Deepdive | 9:00 PM hora España, todos los días | Profundiza 3x en las notas del día |
| 🗂️ Weekend Recap | Domingos 6:00 PM hora España | Junta notas + reflexiones de la semana y da un plan para la próxima |
| 🤝 Contact Follow-up | 10:30 PM hora España, todos los días | Sugiere mensajes de seguimiento para contactos nuevos del día |

El código de los jobs vive en `backend/src/jobs/` (Hackathon Assistant y Pitch Practice Bot viven dentro de `preClassPrep.js`, no son cron jobs aparte).

## Notion

Hub de respaldo con notas, reflexiones, contactos y la tabla de agentes: https://app.notion.com/p/387470a1dd018192b7bdc6fca1cb91f1 — se actualiza solo cada domingo a las 7:00 PM vía una tarea programada de Claude (lee Supabase, escribe en Notion). Automatizarlo directamente desde Railway (sin pasar por Claude) requiere un `NOTION_API_KEY` (no configurado, opcional).

## Calendario

Las 28 clases del programa (horarios estimados) están sincronizadas como eventos en el Google Calendar de Fede (`federicoeckardtd@gmail.com`), con ubicación (Segovia/Madrid) y subject en la descripción. Cuando se confirme el horario real, hay que borrar y recrear estos eventos con la hora correcta — no se actualizan automáticamente.

## Estructura

```
src/                    # Frontend (páginas, componentes, datos del programa)
backend/                # Backend del bot (Express + cron + DeepSeek + Supabase + Telegram)
supabase_setup.sql      # Esquema de la base de datos
CONTINUATION_PROMPT.md  # Estado del proyecto para retomarlo con otro asistente
```

## Desarrollo local

Frontend:
```
npm install
npm start
```

Backend:
```
cd backend
npm install
npm start
```

Ver `.env.example` y `backend/.env.example` para las variables de entorno necesarias.

## Pendiente

`backend/src/data/schedule.js` usa horarios de clase **estimados** (bloques estándar de 9:00 en adelante) porque el horario real del programa todavía no se confirmó. Actualizar `SESSION_START_TIMES` ahí (y su espejo en `src/data/schedule.js`) en cuanto se tenga el horario definitivo, para que Pre-Class Prep dispare a la hora correcta.
