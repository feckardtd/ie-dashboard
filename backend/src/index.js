require('dotenv').config();
const express = require('express');
const cron = require('node-cron');

const { TIMEZONE } = require('./data/schedule');
const { runMorningIntelligence } = require('./jobs/morningIntelligence');
const { runNightDeepdive } = require('./jobs/nightDeepdive');
const { checkUpcomingClasses } = require('./jobs/preClassPrep');
const { runWeekendRecap } = require('./jobs/weekendRecap');
const { runContactFollowup } = require('./jobs/contactFollowup');
const { runNetworkingIcebreaker } = require('./jobs/networkingIcebreaker');
const { runCampOrganizerSync } = require('./jobs/campOrganizerSync');
const { checkActivityReminders } = require('./jobs/activityReminder');

const REQUIRED_ENV = [
  'DEEPSEEK_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`⚠️  Faltan variables de entorno: ${missing.join(', ')}`);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'ie-dashboard-bot', timezone: TIMEZONE });
});

// Manual triggers for testing — no auth, this is a personal-use bot that
// only sends messages to Fede's own Telegram chat. Don't expose this
// domain anywhere public-facing beyond Railway's default URL.
app.get('/test/morning', async (req, res) => {
  try {
    await runMorningIntelligence();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/deepdive', async (req, res) => {
  try {
    await runNightDeepdive();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/preclass', async (req, res) => {
  try {
    await checkUpcomingClasses();
    res.json({ ok: true, note: 'Revisó todas las clases; solo envía si alguna cae en la ventana de 25-30 min antes.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/weekend', async (req, res) => {
  try {
    await runWeekendRecap();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/contacts', async (req, res) => {
  try {
    await runContactFollowup();
    res.json({ ok: true, note: 'Solo envía mensaje si hay contactos agregados en las últimas 24h.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/camporganizer', async (req, res) => {
  try {
    const result = await runCampOrganizerSync();
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/networking', async (req, res) => {
  try {
    await runNetworkingIcebreaker();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/test/activityreminder', async (req, res) => {
  try {
    await checkActivityReminders();
    res.json({ ok: true, note: 'Revisó todas las actividades de hoy; solo envía si alguna cae en la ventana de 9-10 min antes.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`ie-dashboard-bot escuchando en puerto ${PORT} (zona horaria ${TIMEZONE})`);
});

// Morning Intelligence — todos los días 7:00 AM hora de España
cron.schedule(
  '0 7 * * *',
  () => {
    runMorningIntelligence().catch((e) => console.error('[morning] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Night Deepdive — todos los días 9:00 PM hora de España
cron.schedule(
  '0 21 * * *',
  () => {
    runNightDeepdive().catch((e) => console.error('[deepdive] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Pre-Class Prep — checa cada 5 minutos si alguna clase empieza en ~30 min
cron.schedule(
  '*/5 * * * *',
  () => {
    checkUpcomingClasses().catch((e) => console.error('[preclass] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Weekend Recap — todos los domingos 6:00 PM hora de España
cron.schedule(
  '0 18 * * 0',
  () => {
    runWeekendRecap().catch((e) => console.error('[weekend] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Contact Follow-up — todos los días 10:30 PM hora de España (después de
// Night Deepdive, para revisar contactos agregados durante el día)
cron.schedule(
  '30 22 * * *',
  () => {
    runContactFollowup().catch((e) => console.error('[contacts] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Networking Icebreaker — todos los días 12:30 PM hora de España, antes
// del almuerzo/tiempo libre, que es cuando pasa la mayoría del networking
// informal del programa.
cron.schedule(
  '30 12 * * *',
  () => {
    runNetworkingIcebreaker().catch((e) => console.error('[networking] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// CampOrganizer Sync — todos los días 6:30 AM hora de España, antes de
// Morning Intelligence, para tener el horario real cacheado.
cron.schedule(
  '30 6 * * *',
  () => {
    runCampOrganizerSync().catch((e) => console.error('[camporganizer-sync] error:', e.message));
  },
  { timezone: TIMEZONE }
);

// Activity Reminder — checa cada minuto si alguna actividad (clase o
// evento de CampOrganizer) empieza en ~10 min. Convive con Pre-Class Prep
// (30 min antes, con contexto generado por IA, solo para las 28 clases
// formales) — este es un aviso simple y cubre TODO lo programado del día.
cron.schedule(
  '* * * * *',
  () => {
    checkActivityReminders().catch((e) => console.error('[activity-reminder] error:', e.message));
  },
  { timezone: TIMEZONE }
);

console.log('Cron jobs programados: Morning Intelligence (7:00), Night Deepdive (21:00), Pre-Class Prep (cada 5 min), Networking Icebreaker (12:30), Weekend Recap (domingo 18:00), Contact Follow-up (22:30), CampOrganizer Sync (6:30), Activity Reminder (cada minuto).');
