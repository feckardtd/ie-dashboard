# IE Dashboard

Dashboard personal para el IE University Summer School 2026 (Segovia → Madrid, 28 jun – 11 jul 2026). Organiza clases, notas, contactos y reflexiones, y manda mensajes automáticos por Telegram generados por 3 agentes de IA.

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
| 🌙 Night Deepdive | 9:00 PM hora España, todos los días | Profundiza 3x en las notas del día |

El código de los 3 jobs vive en `backend/src/jobs/`.

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
