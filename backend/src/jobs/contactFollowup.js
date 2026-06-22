const { DateTime } = require('luxon');
const { getContactsCreatedBetween } = require('../lib/supabase');
const { contactFollowup: generateFollowup } = require('../lib/deepseek');
const { sendTelegramMessage } = require('../lib/telegram');
const { TIMEZONE } = require('../data/schedule');

// Runs nightly. Looks at contacts added to Supabase in the last 24h and
// suggests a concrete follow-up message for each, so Fede acts on new
// connections while they're still fresh instead of losing them after
// the program ends.
async function runContactFollowup() {
  const now = DateTime.now().setZone(TIMEZONE);
  const dayStart = now.minus({ hours: 24 });

  const { data: contacts, error } = await getContactsCreatedBetween(
    dayStart.toUTC().toISO(),
    now.toUTC().toISO()
  );
  if (error) console.error('[contacts] error leyendo contactos de Supabase:', error.message);

  if (!contacts || contacts.length === 0) {
    console.log('[contacts] sin contactos nuevos en las últimas 24h, no se envía mensaje');
    return;
  }

  const contactSummaries = contacts.map((c) => ({
    nombre: c.name,
    pais: c.country || undefined,
    notas: c.notes || undefined,
  }));

  const message = await generateFollowup(contactSummaries);
  await sendTelegramMessage(`🤝 <b>Contact Follow-up</b>\n\n${message}`);
  console.log(`[contacts] enviado para ${contacts.length} contacto(s) nuevo(s)`);
}

module.exports = { runContactFollowup };
