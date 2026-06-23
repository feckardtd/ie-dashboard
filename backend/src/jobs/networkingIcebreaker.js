const { DateTime } = require('luxon');
const { getContactsCreatedBetween } = require('../lib/supabase');
const { networkingIcebreaker: generateIcebreaker } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { getTodayClasses, TIMEZONE } = require('../data/schedule');

// Runs una vez al día antes del almuerzo. No depende de que haya notas o
// contactos nuevos (a diferencia de Contact Follow-up) — el objetivo es
// dar un empujón ANTES de la próxima interacción social, no después.
async function runNetworkingIcebreaker() {
  const now = DateTime.now().setZone(TIMEZONE);
  const last48h = now.minus({ hours: 48 });

  const { data: contacts, error } = await getContactsCreatedBetween(
    last48h.toUTC().toISO(),
    now.toUTC().toISO()
  );
  if (error) console.error('[networking] error leyendo contactos de Supabase:', error.message);

  const recentContacts = (contacts || []).map((c) => ({
    nombre: c.name,
    pais: c.country || undefined,
  }));

  const todayClasses = getTodayClasses(now);

  const message = await generateIcebreaker(todayClasses, recentContacts);
  await sendTelegramMessage(`🌐 <b>Networking Icebreaker</b>\n\n${message}`);
  console.log('[networking] enviado a Telegram');
}

module.exports = { runNetworkingIcebreaker };
