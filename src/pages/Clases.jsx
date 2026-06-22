import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, Save, Upload, Bot, Sparkles } from 'lucide-react';
import { SUBJECTS, CLASSES } from '../data/schedule';
import { saveNote, getNote } from '../lib/supabase';
import { preClassPrep, nightDeepdive } from '../lib/agents';

// ─── SUBJECT LIST ────────────────────────────────────────────────────────────
export function SubjectList() {
  const [searchParams] = useSearchParams();
  const filterSubject = searchParams.get('subject');

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>Clases <span style={{ color: 'var(--accent)' }}>& Notas</span></h1>
      <p style={styles.pageSubtitle}>Organizado por subject · Semana 1 Segovia · Semana 2 Madrid</p>

      {SUBJECTS.map(subject => {
        const classes = CLASSES.filter(c => c.subjectId === subject.id);
        if (filterSubject && filterSubject !== subject.id) return null;
        return (
          <div key={subject.id} style={styles.subjectBlock}>
            <div style={styles.subjectHeader}>
              <div style={{ ...styles.subjectDot, background: subject.color }} />
              <h2 style={{ ...styles.subjectTitle, color: subject.color }}>
                {subject.icon} {subject.name}
              </h2>
              <span style={styles.subjectTag}>
                {classes.filter(c => c.week === 1).length > 0 ? '📍 Segovia' : ''}
                {classes.filter(c => c.week === 2).length > 0 ? ' 📍 Madrid' : ''}
              </span>
            </div>
            <div style={styles.classList}>
              {classes.map(cls => (
                <Link to={`/clases/${cls.id}`} key={cls.id} style={styles.classRow}>
                  <div style={{ ...styles.classBar, background: subject.color }} />
                  <div style={styles.classInfo}>
                    <p style={styles.className}>{cls.name}</p>
                    <p style={styles.classMeta}>
                      Semana {cls.week} · {cls.location} · {cls.day} · Sesión {cls.session}
                    </p>
                  </div>
                  <span style={styles.classArrow}>→</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── CLASS DETAIL ─────────────────────────────────────────────────────────────
export function ClassDetail() {
  const { id } = useParams();
  const cls = CLASSES.find(c => c.id === id);
  const subject = cls ? SUBJECTS.find(s => s.id === cls.subjectId) : null;

  const [professor, setProfessor] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [agentResponse, setAgentResponse] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(null); // 'preclass' | 'deepdive'

  useEffect(() => {
    if (!id) return;
    getNote(id).then(({ data }) => {
      if (data) {
        setNotes(data.content || '');
        setProfessor(data.professor || '');
      }
    });
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveNote(id, notes, professor);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id, notes, professor]);

  const runAgent = async (mode) => {
    setAgentMode(mode);
    setAgentLoading(true);
    setAgentResponse('');
    try {
      let response;
      if (mode === 'preclass') {
        response = await preClassPrep(cls.name, subject?.name, notes);
      } else {
        response = await nightDeepdive(notes, cls.name, subject?.name);
      }
      setAgentResponse(response);
    } catch (e) {
      setAgentResponse('Error al conectar con el agente. Verifica tu API key.');
    }
    setAgentLoading(false);
  };

  if (!cls) return <div style={styles.page}><p style={{ color: 'var(--text-muted)' }}>Clase no encontrada.</p></div>;

  return (
    <div style={styles.page}>
      <Link to="/clases" style={styles.back}>
        <ChevronLeft size={16} /> Volver a clases
      </Link>

      {/* Header */}
      <div style={styles.classHeader}>
        <div style={{ ...styles.subjectBadge, background: subject?.color + '22', border: `1px solid ${subject?.color}44` }}>
          <span>{subject?.icon}</span>
          <span style={{ color: subject?.color, fontSize: 12, fontWeight: 600 }}>{subject?.name}</span>
        </div>
        <h1 style={styles.classTitle}>{cls.name}</h1>
        <p style={styles.classMeta2}>
          Semana {cls.week} · {cls.location} · {cls.day} · Sesión {cls.session}
        </p>
      </div>

      <div style={styles.grid2}>
        {/* LEFT: Notes */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Profesor / Facilitador</h3>
          </div>
          <input
            style={styles.input}
            placeholder="Escribe el nombre del profesor cuando lo presenten..."
            value={professor}
            onChange={e => setProfessor(e.target.value)}
          />

          <div style={{ ...styles.cardHeader, marginTop: 24 }}>
            <h3 style={styles.cardTitle}>Mis Notas</h3>
            <button
              style={{ ...styles.btn, ...(saved ? styles.btnSuccess : {}) }}
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={14} />
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
            </button>
          </div>
          <textarea
            style={styles.textarea}
            placeholder={`Toma notas de ${cls.name} aquí...\n\nConceptos clave:\n- \n\nPreguntas que surgieron:\n- \n\nConexiones con otras clases:\n- `}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Upload */}
          <div style={styles.uploadArea}>
            <Upload size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Sube los slides o documentos del profe (coming soon)
            </span>
          </div>
        </div>

        {/* RIGHT: Agents */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}><Bot size={14} /> Agentes IA</h3>
          </div>

          <div style={styles.agentBtns}>
            <button style={styles.agentBtn} onClick={() => runAgent('preclass')} disabled={agentLoading}>
              <Sparkles size={14} style={{ color: 'var(--gold)' }} />
              <div>
                <p style={styles.agentBtnTitle}>Pre-Class Prep</p>
                <p style={styles.agentBtnSub}>Prepárate antes de entrar</p>
              </div>
            </button>
            <button style={styles.agentBtn} onClick={() => runAgent('deepdive')} disabled={agentLoading}>
              <Bot size={14} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={styles.agentBtnTitle}>Night Deepdive</p>
                <p style={styles.agentBtnSub}>Profundiza 3x lo que aprendiste</p>
              </div>
            </button>
          </div>

          {agentLoading && (
            <div style={styles.agentLoading}>
              <div style={styles.loadingDot} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {agentMode === 'preclass' ? 'Preparando tu ventaja...' : 'Profundizando en tus notas...'}
              </span>
            </div>
          )}

          {agentResponse && (
            <div style={styles.agentResponse}>
              <p style={styles.agentResponseLabel}>
                {agentMode === 'preclass' ? '🌅 Pre-Class Prep' : '🌙 Night Deepdive'}
              </p>
              <div style={styles.agentResponseText}>
                {agentResponse.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: line ? 6 : 0 }}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {!agentResponse && !agentLoading && (
            <div style={styles.agentEmpty}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Usa los agentes para prepararte ANTES de clase<br />o profundizar DESPUÉS
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  pageTitle: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  pageSubtitle: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 40, fontFamily: 'var(--mono)' },
  subjectBlock: { marginBottom: 40 },
  subjectHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  subjectDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  subjectTitle: { fontSize: 16, fontWeight: 700 },
  subjectTag: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: 'auto' },
  classList: { display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 18 },
  classRow: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 8, overflow: 'hidden',
  },
  classBar: { width: 3, alignSelf: 'stretch' },
  classInfo: { flex: 1, padding: '12px 14px' },
  className: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  classMeta: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  classArrow: { padding: '0 14px', color: 'var(--text-dim)' },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 13, color: 'var(--text-muted)', marginBottom: 28,
  },
  classHeader: { marginBottom: 32 },
  subjectBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 6, marginBottom: 12,
  },
  classTitle: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  classMeta2: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '24px',
  },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 },
  input: {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 14, outline: 'none',
  },
  textarea: {
    width: '100%', height: 300, padding: '12px',
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none',
    fontFamily: 'var(--mono)', lineHeight: 1.6,
  },
  btn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text)', fontSize: 12, fontWeight: 500,
  },
  btnSuccess: { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' },
  uploadArea: {
    marginTop: 12, padding: '14px', borderRadius: 8,
    border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8,
  },
  agentBtns: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  agentBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, textAlign: 'left',
  },
  agentBtnTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 },
  agentBtnSub: { fontSize: 11, color: 'var(--text-muted)' },
  agentLoading: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' },
  loadingDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
    animation: 'pulse 1s infinite',
  },
  agentResponse: {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '16px',
  },
  agentResponseLabel: {
    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
    marginBottom: 10, fontWeight: 600,
  },
  agentResponseText: { fontSize: 13, lineHeight: 1.7, color: 'var(--text)' },
  agentEmpty: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 0',
  },
};
