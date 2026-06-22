const API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(systemPrompt, userMessage, maxTokens = 800) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY no está configurada');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response';
}

// Same prompts as the frontend src/lib/agents.js, so messages sent by
// Telegram match what the in-app "Probar ahora" buttons would generate.

async function morningIntelligence(yesterdayNotes, todayClasses) {
  const system = `Eres el agente de inteligencia matutina de Fede, un estudiante de 16 años en el Pre-University Summer Program de IE University. Tu trabajo es prepararlo para el día con ventaja competitiva. Sé conciso, energético y útil. Máximo 200 palabras. Responde en español.`;
  const user = `Notas de ayer: ${JSON.stringify(yesterdayNotes)}. Clases de hoy: ${todayClasses.map((c) => c.name).join(', ') || 'ninguna'}. Dame: 1) Los 3 insights clave de ayer que Fede debe recordar. 2) Cómo conectan con las clases de hoy. 3) Una pregunta inteligente que puede hacer hoy para destacar.`;
  return callDeepSeek(system, user);
}

async function preClassPrep(className, subjectName, previousNotes) {
  const system = `Eres el agente de preparación pre-clase de Fede en IE University. Tu trabajo es prepararlo para entrar a clase con ventaja. Sé específico y útil. Máximo 150 palabras. Responde en español.`;
  const user = `Va a entrar a la clase "${className}" del subject "${subjectName}". Notas previas del subject: ${JSON.stringify(previousNotes)}. Dame: 1) Los conceptos clave que necesita repasar. 2) Una pregunta inteligente para hacer en clase. 3) Qué esperar que enseñen.`;
  return callDeepSeek(system, user, 500);
}

async function nightDeepdive(todayNotes, className, subjectName) {
  const system = `Eres el agente de estudio nocturno de Fede en IE University. Tu trabajo es profundizar 3x más en lo que aprendió hoy para que mañana sea el más preparado del grupo. Sé profundo pero claro. Máximo 300 palabras. Responde en español.`;
  const user = `Las notas de hoy de "${className}" (${subjectName}): "${todayNotes}". Dame: 1) Los 3 conceptos más importantes expandidos. 2) Conexiones con el mundo real o empresas reales. 3) 3 preguntas difíciles para testear su comprensión. 4) Un insight que el 90% de sus compañeros NO va a saber.`;
  return callDeepSeek(system, user, 900);
}

async function weekendRecap(weekNotes, weekReflections, classNames) {
  const system = `Eres el agente de recap semanal de Fede en el Pre-University Summer Program de IE University. Tu trabajo es ayudarlo a ver el panorama completo de la semana que pasó y armar un plan de ataque para la próxima. Sé motivador pero concreto. Máximo 250 palabras. Responde en español.`;
  const user = `Clases de esta semana: ${classNames.join(', ') || 'ninguna'}. Notas guardadas: ${JSON.stringify(weekNotes)}. Reflexiones diarias: ${JSON.stringify(weekReflections)}. Dame: 1) El hilo conductor de la semana (qué conecta todas las clases). 2) Su mayor progreso o momento de orgullo. 3) Una cosa concreta para mejorar la próxima semana. 4) Una pregunta para que reflexione el domingo.`;
  return callDeepSeek(system, user, 700);
}

module.exports = { callDeepSeek, morningIntelligence, preClassPrep, nightDeepdive, weekendRecap };
