import React, { useState, useEffect } from 'react';
import { BookMarked } from 'lucide-react';
import { saveReflection, getReflections } from '../lib/supabase';

const today = () => new Date().toISOString().split('T')[0];

export default function Reflexiones() {
  const [reflections, setReflections] = useState([]);
  const [active, setActive] = useState(today());
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getReflections().then(({ data }) => { if (data) setReflections(data); });
  }, []);

  useEffect(() => {
    const found = reflections.find(r => r.date === active);
    setContent(found?.content || '');
  }, [active, reflections]);

  const handleSave = async () => {
    setSaving(true);
    const { data } = await saveReflection(active, content);
    if (data?.[0]) {
      setReflections(prev => {
        const idx = prev.findIndex(r => r.date === active);
        if (idx >= 0) { const n = [...prev]; n[idx] = data[0]; return n; }
        return [data[0], ...prev];
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatDate = (d) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const PROMPTS = [
    '¿Qué fue lo más importante que aprendí hoy?',
    '¿Qué conexión interesante hice con alguien?',
    '¿Qué me sorprendió de una clase o actividad?',
    '¿Cómo mejoré mi inglés hoy?',
    '¿Qué haría diferente mañana?',
  ];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Reflexiones <span style={{ color: 'var(--accent)' }}>Diarias</span></h1>
      <p style={styles.sub}>Tu journal privado del programa · visible solo para ti</p>

      <div style={styles.layout}>
        {/* Sidebar: dates */}
        <div style={styles.sidebar}>
          <p style={styles.sidebarTitle}>Días del programa</p>

          <p style={styles.weekLabel}>SEMANA 1 — SEGOVIA</p>
          {['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03'].map(d => {
            const hasNote = reflections.some(r => r.date === d);
            return (
              <button key={d} style={{ ...styles.dateBtn, ...(active === d ? styles.dateBtnActive : {}) }} onClick={() => setActive(d)}>
                <span style={styles.dateBtnDay}>{formatDate(d).split(',')[0]}</span>
                <span style={styles.dateBtnDate}>{formatDate(d).split(',').slice(1).join(',').trim()}</span>
                {hasNote && <span style={styles.hasNoteDot} />}
              </button>
            );
          })}

          <p style={{ ...styles.weekLabel, marginTop: 20 }}>SEMANA 2 — MADRID</p>
          {['2026-07-05', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11'].map(d => {
            const hasNote = reflections.some(r => r.date === d);
            return (
              <button key={d} style={{ ...styles.dateBtn, ...(active === d ? styles.dateBtnActive : {}) }} onClick={() => setActive(d)}>
                <span style={styles.dateBtnDay}>{formatDate(d).split(',')[0]}</span>
                <span style={styles.dateBtnDate}>{formatDate(d).split(',').slice(1).join(',').trim()}</span>
                {hasNote && <span style={styles.hasNoteDot} />}
              </button>
            );
          })}
        </div>

        {/* Main: editor */}
        <div style={styles.main}>
          <div style={styles.editorHeader}>
            <div>
              <p style={styles.editorDate}>{formatDate(active)}</p>
              <p style={styles.editorSub}>Reflexión del día</p>
            </div>
            <button
              style={{ ...styles.saveBtn, ...(saved ? styles.saveBtnSuccess : {}) }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : saved ? '¡Guardado! ✅' : 'Guardar'}
            </button>
          </div>

          <textarea
            style={styles.editor}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`¿Cómo fue este día?\n\n${PROMPTS.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}`}
          />

          {/* Prompts helper */}
          {!content && (
            <div style={styles.prompts}>
              <p style={styles.promptsTitle}>PREGUNTAS GUÍA</p>
              {PROMPTS.map((p, i) => (
                <button key={i} style={styles.promptBtn} onClick={() => setContent(prev => prev + (prev ? '\n\n' : '') + p + '\n')}>
                  <span style={{ color: 'var(--accent)' }}>{i + 1}.</span> {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline of all entries */}
      {reflections.length > 0 && (
        <div style={styles.timeline}>
          <p style={styles.timelineTitle}><BookMarked size={14} /> Todas tus reflexiones</p>
          {reflections.map(r => (
            <div key={r.date} style={styles.timelineItem} onClick={() => setActive(r.date)}>
              <div style={styles.timelineDot} />
              <div style={styles.timelineContent}>
                <p style={styles.timelineDate}>{formatDate(r.date)}</p>
                <p style={styles.timelinePreview}>{r.content?.slice(0, 120)}...</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 32 },
  layout: { display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 40 },
  sidebar: {},
  sidebarTitle: { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 12, textTransform: 'uppercase' },
  weekLabel: { fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 8, textTransform: 'uppercase' },
  dateBtn: {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    background: 'none', border: '1px solid transparent', textAlign: 'left',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
    position: 'relative',
  },
  dateBtnActive: { background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)' },
  dateBtnDay: { fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 32 },
  dateBtnDate: { fontSize: 10, color: 'var(--text-muted)', flex: 1, fontFamily: 'var(--mono)' },
  hasNoteDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  main: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
  },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  editorDate: { fontSize: 20, fontWeight: 700, textTransform: 'capitalize' },
  editorSub: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  saveBtn: {
    padding: '8px 16px', borderRadius: 7,
    background: 'var(--accent)', border: 'none', color: '#fff',
    fontSize: 13, fontWeight: 600,
  },
  saveBtnSuccess: { background: 'var(--green)' },
  editor: {
    width: '100%', minHeight: 300, padding: '16px',
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 14, lineHeight: 1.8, resize: 'vertical', outline: 'none',
    fontFamily: 'var(--font)',
  },
  prompts: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px' },
  promptsTitle: { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 12 },
  promptBtn: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '8px 0', background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: 13, cursor: 'pointer', lineHeight: 1.5, borderBottom: '1px solid var(--border)',
  },
  timeline: { marginTop: 20 },
  timelineTitle: { fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '1px' },
  timelineItem: {
    display: 'flex', gap: 16, cursor: 'pointer',
    padding: '12px 0', borderTop: '1px solid var(--border)',
  },
  timelineDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: 13, fontWeight: 600, marginBottom: 3, textTransform: 'capitalize' },
  timelinePreview: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 },
};
