# Cómo desplegar tu propia copia de este dashboard

Esta guía es para alguien que quiere tener su propia versión de este dashboard,
completamente separada — con su propia base de datos, su propio bot de
Telegram y (si aplica) su propia integración con CampOrganizer. Nada de lo que
hagas en tu copia toca los datos de la persona que te compartió el repo.

## Paso 1 — Crear tus cuentas (todas gratis)

1. **GitHub** — si no tenés cuenta, creá una. Después hacé "Fork" del repo que
   te compartieron (botón arriba a la derecha en la página del repo en
   GitHub). Esto te da tu propia copia del código.
2. **Vercel** (vercel.com) — para el frontend. Entrá con tu cuenta de GitHub.
3. **Railway** (railway.app) — para el backend. Entrá con tu cuenta de GitHub.
4. **Supabase** (supabase.com) — tu propia base de datos. Creá un proyecto
   nuevo (elegí una región cercana, por ejemplo Europa).
5. **Telegram bot** — abrí Telegram, buscá `@BotFather`, mandale `/newbot`,
   seguí los pasos. Te va a dar un **token**. Después mandale un mensaje a tu
   bot nuevo y visitá `https://api.telegram.org/bot<TU_TOKEN>/getUpdates` para
   ver tu **chat_id**.
6. *(Opcional)* Si también usás CampOrganizer, tené a mano tu email y
   contraseña de esa app — los vas a necesitar como variables de entorno,
   nunca los compartas en texto plano con nadie más que con vos mismo.

## Paso 2 — Base de datos

En tu proyecto de Supabase, abrí el **SQL Editor** y corré el contenido del
archivo `supabase_setup.sql` del repo. Eso crea las tablas (`notes`,
`contacts`, `reflections`) y el bucket de fotos.

Si también vas a usar la parte de CampOrganizer, hay que crear además la
tabla `camp_schedule_cache` con una policy "Allow all" (igual patrón que las
otras tablas) — pedile esto a Claude Code/Cowork, abajo te dejo el prompt.

## Paso 3 — Variables de entorno

**Backend (Railway)** — variables a configurar:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (de tu proyecto Supabase)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (de tu bot)
- `DEEPSEEK_API_KEY` (si vas a usar los agentes de IA)
- `PORT=3000`
- *(Opcional)* `CAMP_ORGANIZER_EMAIL`, `CAMP_ORGANIZER_PASSWORD` si usás esa
  integración
- *(Opcional)* `NOTION_API_KEY`, `NOTION_PAGE_ID` si usás Notion

**Frontend (Vercel)** — variables a configurar:
- `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` (mismas que arriba)
- `REACT_APP_DEEPSEEK_API_KEY`
- `REACT_APP_TELEGRAM_BOT_TOKEN`

## Paso 4 — Personalizar tu horario

Este dashboard fue armado originalmente para un programa específico (fechas,
clases, sesiones). Vas a tener que editar estos archivos con TUS fechas y
clases:

- `src/data/schedule.js` — lista de clases, materias y sesiones
- `src/pages/Schedule.jsx` — el array `WEEKS` (fechas del calendario)
- `src/pages/Dashboard.jsx` — constantes `WEEK1_START`/`WEEK2_START`
- `backend/src/lib/campOrganizer.js` — la constante `SESSION_ID` (solo si
  usás CampOrganizer; es el ID de TU sesión/camp, no el de otra persona)

No hace falta que lo hagas a mano — para esto es justamente el prompt de
abajo.

## Paso 5 — El prompt para Claude Code o Cowork

Una vez que tengas el repo forkeado y las cuentas creadas, abrí Claude Code
(o Cowork) **desde tu propio usuario**, parado en la carpeta de tu fork, y
pegale esto:

```
Tengo un fork de un dashboard personal (React + Node/Express + Supabase).
Quiero desplegar mi propia copia, totalmente separada de la original.

Ya tengo:
- Cuenta de Vercel y Railway conectadas a mi GitHub
- Un proyecto nuevo de Supabase (te paso URL y anon key)
- Un bot de Telegram (token y chat_id)
- [Si aplica: mi email/password de CampOrganizer]

Necesito que:
1. Leas supabase_setup.sql y me digas exactamente qué correr en el SQL
   Editor de mi proyecto Supabase (incluyendo camp_schedule_cache si uso
   CampOrganizer)
2. Me ayudes a configurar las variables de entorno en Railway (backend) y
   Vercel (frontend) según el README/.env.example
3. Edites src/data/schedule.js, src/pages/Schedule.jsx, src/pages/Dashboard.jsx
   y backend/src/lib/campOrganizer.js (SESSION_ID) con MI horario real:
   [acá describís tus fechas, clases, sesión de CampOrganizer, etc.]
4. Verifiques que el build compila (npm run build en el frontend) antes de
   pedirme que haga push
5. Me digas paso a paso cómo conectar el repo a Vercel y Railway para que
   quede desplegado en una URL propia

No quiero tocar ni depender de ninguna cuenta, base de datos o bot que no sea
mío.
```

Con eso, Claude Code/Cowork puede hacer casi todo el trabajo de código y
configuración — vos solo tenés que ir pegando las claves de tus propias
cuentas cuando te las pida.
