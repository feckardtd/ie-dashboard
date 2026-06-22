import React, { useState } from 'react';
import { Sunrise, BookOpen, Moon, Zap } from 'lucide-react';
import { morningIntelligence } from '../lib/agents';

const AGENTS = [
  {
    id: 'morning',
    name: 'Morning Intelligence',
    emoji: '🌅',
    icon: Sunrise,
    color: '#f5c842',
    time: '7:00 AM',
    description: 'Te prepara cada mañana con un resumen de lo aprendido, insights clave y ventaja competitiva para el día.',
    telegram: true,
    active: true,
  },
  {
    id: 'preclass',
    name: 'Pre-Class Prep',
    emoji: '📚',
    icon: BookOpen,
    color: '#6c63ff',
    time: '30 min antes de clase',
    description: 'Busca tus notas pasadas y te prepara con contexto, conceptos clave y preguntas inteligentes antes de cada sesión.',
    telegram: true,
    active: true,
  },
  {
    id: 'deepdive',
    name: 'Night Deepdive',
    emoji: '🌙',
    icon: Moon,
    color: '#14b8a6',
    time: '9:00 PM',
    description: 'Lee tus notas del día, las profundiza 3x, genera preguntas difíciles y crea tu ventaja para el día siguiente.',
    telegram: true,
    active: true,
  },
];

export default function Agentes() {
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState('');

  const testMorning = async () => {
    setTesting('morning');
    setTestResult('');
    try {
      const result = await morningIntelligence(
        [{ clase: 'Icebreaker', notas: 'Conocí al equipo, trabajamos en dinámica de Two Truths and a Lie' }],
        [{ name: 'Sustainability Introduction & SDGs' }, { name: 'Social Impact' }]
      );
      setTestResult(result);
    } catch (e) {
      setTestResult('Error al conectar. Verifica tu REACT_APP_DEEPSEEK_API_KEY en el .env.local');
    }
    setTesting(null);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Agentes <span style={{ color: 'var(--accent)' }}>IA</span></h1>
      <p style={styles.sub}>3 agentes activos · conectados a DeepSeek · disponibles en Telegram</p>

      {/* How it works */}
      <div style={styles.flowCard}>
        <p style={styles.flowTitle}>FLUJO DIARIO AUTOMÁTICO</p>
        <div style={styles.flow}>
          {[
            { time: '7:00 AM', label: 'Morning Intelligence', icon: '🌅', color: '#f5c842' },
            { time: 'Antes de clase', label: 'Pre-Class Prep', icon: '📚', color: '#6c63ff' },
            { time: 'En clase', label: 'TÚ tomas notas', icon: '✏️', color: 'var(--text-muted)' },
            { time: '9:00 PM', label: 'Night Deepdive', icon: '🌙', color: '#14b8a6' },
            { time: 'Mañana', label: 'Repite con ventaja', icon: '⚡', color: 'var(--gold)' },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <div style={styles.flowStep}>
                <span style={{ fontSize: 20 }}>{step.icon}</span>
                <p style={{ ...styles.flowStepLabel, color: step.color }}>{step.label}</p>
                <p style={styles.flowStepTime}>{step.time}</p>
              </div>
              {i < 4 && <div style={styles.flowArrow}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      <div style={styles.grid}>
        {AGENTS.map(agent => {
          return (
            <div key={agent.id} style={{ ...styles.card, borderColor: agent.color + '44' }}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.agentIcon, background: agent.color + '22', border: `1px solid ${agent.color}44` }}>
                  <span style={{ fontSize: 24 }}>{agent.emoji}</span>
                </div>
                <div style={{ ...styles.activeBadge, background: '#22c55e22', border: '1px solid #22c55e44' }}>
                  <span style={styles.activeDot} />
                  <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--mono)' }}>ACTIVO</span>
                </div>
              </div>

              <h3 style={{ ...styles.agentName, color: agent.color }}>{agent.name}</h3>
              <p style={styles.agentTime}>
                <Zap size={10} style={{ color: agent.color }} /> {agent.time}
              </p>
              <p style={styles.agentDesc}>{agent.description}</p>

              <div style={styles.cardFooter}>
                {agent.telegram && (
                  <div style={styles.telegramBadge}>
                    <span style={{ fontSize: 12 }}>✈️</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Telegram habilitado</span>
                  </div>
                )}
                {agent.id === 'morning' && (
                  <button
                    style={{ ...styles.testBtn, borderColor: agent.color + '44', color: agent.color }}
                    onClick={testMorning}
                    disabled={testing === 'morning'}
                  >
                    {testing === 'morning' ? 'Probando...' : 'Probar ahora'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Test Result */}
      {testResult && (
        <div style={styles.testResult}>
          <p style={styles.testResultLabel}>🌅 Resultado Morning Intelligence (prueba)</p>
          <div style={styles.testResultText}>
            {testResult.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: line ? 6 : 0 }}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Setup Section */}
      <div style={styles.setupCard}>
        <h3 style={styles.setupTitle}>⚙️ Configuración</h3>
        <div style={styles.setupList}>
          {[
            { label: 'DeepSeek API Key', desc: 'Configurada en el backend de Railway', done: true },
            { label: 'Supabase URL + Key', desc: 'Conectado para guardar notas y compartirlas con los agentes', done: true },
            { label: 'Telegram Bot Token', desc: 'Conectado — recibes mensajes automáticos en tu cel', done: true },
            { label: 'Backend en Railway', desc: 'Los 3 agentes corren 24/7 en la nube con cron jobs', done: true },
          ].map(({ label, desc, done }) => (
            <div key={label} style={styles.setupItem}>
              <span style={{ fontSize: 16 }}>{done ? '✅' : '⏳'}</span>
              <div>
                <p style={styles.setupLabel}>{label}</p>
                <p style={styles.setupDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 32 },
  flowCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '24px', marginBottom: 32,
  },
  flowTitle: { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 20 },
  flow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flowStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 8px' },
  flowStepLabel: { fontSize: 12, fontWeight: 600, textAlign: 'center' },
  flowStepTime: { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', textAlign: 'center' },
  flowArrow: { color: 'var(--text-dim)', fontSize: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 },
  card: {
    background: 'var(--bg-card)', border: '1px solid',
    borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  agentIcon: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activeBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20 },
  activeDot: { width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' },
  agentName: { fontSize: 16, fontWeight: 700 },
  agentTime: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 },
  agentDesc: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, flex: 1 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  telegramBadge: { display: 'flex', alignItems: 'center', gap: 5 },
  testBtn: {
    padding: '6px 12px', borderRadius: 6, background: 'none',
    border: '1px solid', fontSize: 12, fontWeight: 600,
  },
  testResult: {
    background: 'var(--bg-card)', border: '1px solid var(--accent-glow)',
    borderRadius: 12, padding: '24px', marginBottom: 32,
  },
  testResultLabel: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 },
  testResultText: { fontSize: 13, lineHeight: 1.7 },
  setupCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '24px',
  },
  setupTitle: { fontSize: 14, fontWeight: 700, marginBottom: 16 },
  setupList: { display: 'flex', flexDirection: 'column', gap: 12 },
  setupItem: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  setupLabel: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  setupDesc: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
};
