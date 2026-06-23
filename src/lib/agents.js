const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(systemPrompt, userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

// AGENT 1: Morning Intelligence
export async function morningIntelligence(yesterdayNotes, todayClasses) {
  const system = `Eres el agente de inteligencia matutina de Fede, un estudiante de 16 años en el Pre-University Summer Program de IE University. Tu trabajo es prepararlo para el día con ventaja competitiva. Sé conciso, energético y útil. Máximo 200 palabras. Responde en español.`;
  const user = `Notas de ayer: ${JSON.stringify(yesterdayNotes)}. Clases de hoy: ${todayClasses.map(c => c.name).join(', ')}. Dame: 1) Los 3 insights clave de ayer que Fede debe recordar. 2) Cómo conectan con las clases de hoy. 3) Una pregunta inteligente que puede hacer hoy para destacar.`;
  return callDeepSeek(system, user);
}

// AGENT 2: Pre-Class Prep
export async function preClassPrep(className, subjectName, previousNotes) {
  const system = `Eres el agente de preparación pre-clase de Fede en IE University. Tu trabajo es prepararlo para entrar a clase con ventaja. Sé específico y útil. Máximo 150 palabras. Responde en español.`;
  const user = `Va a entrar a la clase "${className}" del subject "${subjectName}". Notas previas del subject: ${JSON.stringify(previousNotes)}. Dame: 1) Los conceptos clave que necesita repasar. 2) Una pregunta inteligente para hacer en clase. 3) Qué esperar que enseñen.`;
  return callDeepSeek(system, user);
}

// AGENT 3: Night Deepdive
export async function nightDeepdive(todayNotes, className, subjectName) {
  const system = `Eres el agente de estudio nocturno de Fede en IE University. Tu trabajo es profundizar 3x más en lo que aprendió hoy para que mañana sea el más preparado del grupo. Sé profundo pero claro. Máximo 300 palabras. Responde en español.`;
  const user = `Las notas de hoy de "${className}" (${subjectName}): "${todayNotes}". Dame: 1) Los 3 conceptos más importantes expandidos. 2) Conexiones con el mundo real o empresas reales. 3) 3 preguntas difíciles para testear su comprensión. 4) Un insight que el 90% de sus compañeros NO va a saber.`;
  return callDeepSeek(system, user);
}

// AGENT 5: Hackathon Assistant (mirrors backend/src/lib/deepseek.js hackathonPrep,
// so the "Probar ahora" button in Agentes.jsx matches what Telegram sends)
export async function hackathonPrep(className, previousNotes) {
  const system = `Eres el agente de Hackathon Assistant de Fede en el Pre-University Summer Program de IE University. Tu trabajo es prepararlo en modo "builder" antes de cada sesión de hackathon, para que llegue con ventaja frente al resto de los equipos. Sé táctico y concreto, como un mentor de startups. Máximo 180 palabras. Responde en español.`;
  const user = `Va a entrar a la sesión de hackathon "${className}". Notas previas relacionadas: ${JSON.stringify(previousNotes)}. Dame: 1) Qué debería tener listo o decidido ANTES de entrar (problema, hipótesis, datos). 2) Una técnica concreta de customer discovery o framing de problema que pueda usar hoy. 3) Una pregunta incómoda que debería hacerse a sí mismo o a su equipo para no enamorarse de la primera idea.`;
  return callDeepSeek(system, user);
}

// AGENT 6: Pitch Practice Bot (mirrors backend/src/lib/deepseek.js pitchPrep)
export async function pitchPrep(className, previousNotes) {
  const system = `Eres el Pitch Practice Bot de Fede en el Pre-University Summer Program de IE University. Tu trabajo es ponerlo en modo competencia antes de cada sesión de pitch, simulando lo que un jurado exigente le preguntaría. Sé directo y exigente pero motivador. Máximo 180 palabras. Responde en español.`;
  const user = `Va a entrar a la sesión "${className}". Notas previas de pitch/storytelling: ${JSON.stringify(previousNotes)}. Dame: 1) Las 3 preguntas más duras que un jurado de inversión le haría hoy sobre su idea o pitch. 2) Un error común de storytelling que debe evitar en esta sesión específica. 3) Una frase de apertura (hook) que podría probar para captar atención en los primeros 10 segundos.`;
  return callDeepSeek(system, user);
}

// AGENT 7: Contact Follow-up (mirrors backend/src/lib/deepseek.js contactFollowup)
export async function contactFollowup(contacts) {
  const system = `Eres el agente de seguimiento de contactos de Fede en el Pre-University Summer Program de IE University. Tu trabajo es ayudarlo a no perder las conexiones que está haciendo con gente de todo el mundo. Sé cálido pero práctico. Máximo 220 palabras. Responde en español.`;
  const user = `Hoy Fede agregó estos contactos nuevos: ${JSON.stringify(contacts)}. Para cada contacto, dame un mensaje corto y específico (1-2 frases, en inglés si el contacto parece no hispanohablante) que podría mandarle por LinkedIn/Instagram/email para mantener el contacto, mencionando algo concreto de lo que compartieron si la info lo permite. Si no hay suficiente info, sugiere una pregunta genuina para conocerlo mejor.`;
  return callDeepSeek(system, user);
}

// AGENT 8: Networking Icebreaker Bot (mirrors backend/src/lib/deepseek.js networkingIcebreaker)
export async function networkingIcebreaker(todayClasses, recentContacts) {
  const system = `Eres el agente de networking de Fede en el Pre-University Summer Program de IE University, un programa con estudiantes de decenas de países. Tu trabajo es ayudarlo a tener conversaciones genuinas (no genéricas) con gente nueva en almuerzos, tiempo libre o eventos sociales. Sé cálido, concreto y nada cursi. Máximo 150 palabras. Responde en español.`;
  const user = `Clases de hoy: ${todayClasses.map(c => c.name).join(', ') || 'ninguna'}. Contactos que ya hizo recientemente: ${JSON.stringify(recentContacts)}. Dame: 1) Una pregunta o tema de conversación mejor que "where are you from" para usar hoy en el almuerzo o tiempo libre, idealmente conectado con las clases de hoy. 2) Un micro-tip cultural o de idioma útil para una conversación con alguien de otro país (puede ser inglés si aplica). 3) Una forma natural de invitar a alguien nuevo a sentarse junto/sumarse a un plan, sin que se sienta forzado.`;
  return callDeepSeek(system, user);
}
