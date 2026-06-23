// Cliente mínimo para la API de Notion (sin SDK, igual que telegram.js).
// Permite que el backend escriba directamente en el Hub de Notion sin pasar
// por una tarea programada externa. Si las variables de entorno no están
// configuradas, las funciones no hacen nada (fail-safe: nunca rompe el flujo
// principal de Telegram/DeepSeek).

const NOTION_VERSION = '2022-06-28';
const MAX_BLOCK_CHARS = 1900; // límite real de Notion es 2000 por rich_text

function chunkText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length ? chunks : [''];
}

function textBlock(content) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function headingBlock(content) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: { rich_text: [{ type: 'text', text: { content } }] },
  };
}

function isNotionConfigured() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_PAGE_ID);
}

// Agrega al final del Hub de Notion un bloque con el recap semanal.
// No lanza si Notion no está configurado: simplemente no hace nada (el sync
// manual semanal de Claude sigue funcionando como respaldo).
async function appendWeeklyRecapToNotion({ weekLabel, recapText }) {
  if (!isNotionConfigured()) {
    console.log('[notion] NOTION_API_KEY / NOTION_PAGE_ID no configuradas, omito sync directo');
    return { skipped: true };
  }

  const apiKey = process.env.NOTION_API_KEY;
  const pageId = process.env.NOTION_PAGE_ID;
  const url = `https://api.notion.com/v1/blocks/${pageId}/children`;

  const children = [
    headingBlock(`🗂️ Recap automático — ${weekLabel}`),
    ...chunkText(recapText, MAX_BLOCK_CHARS).map(textBlock),
  ];

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ children }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Notion API error: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

module.exports = { appendWeeklyRecapToNotion, isNotionConfigured };
