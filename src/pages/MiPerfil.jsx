import React, { useState } from 'react';
import { Target, Globe, Users, Heart, BookOpen, Edit3, Save } from 'lucide-react';

const OBJECTIVES = [
  { id: 'academic', icon: BookOpen, label: 'Académico', color: '#6c63ff', goal: 'Contribuir activamente al Hackathon y competencia de pitch. Hacer al menos 1 pregunta inteligente por clase.' },
  { id: 'english', icon: Globe, label: 'Inglés', color: '#f5c842', goal: 'Hablar inglés a pesar de los errores. Priorizar conversación real sobre perfección.' },
  { id: 'networking', icon: Users, label: 'Networking', color: '#22c55e', goal: 'Conectar con 5+ peers y 2+ instructores/speakers. Agregar a todos en contactos.' },
  { id: 'social', icon: Heart, label: 'Social', color: '#ec4899', goal: 'Aprender nombres rápidamente. Conectar con participantes de distintos países.' },
  { id: 'personal', icon: Target, label: 'Bienestar', color: '#14b8a6', goal: 'Probar todas las actividades. Reflexión diaria. Gestionar la distancia del hogar.' },
];

const STATUS = [
  { label: 'En camino', color: 'var(--green)', bg: 'var(--green-dim)', border: '#22c55e44' },
  { label: 'Por mejorar', color: 'var(--gold)', bg: 'var(--gold-dim)', border: '#f5c84244' },
  { label: 'Necesita atención', color: 'var(--red)', bg: '#ef444422', border: '#ef444444' },
];

export default function MiPerfil() {
  const [progress, setProgress] = useState({
    academic: 0, english: 0, networking: 0, social: 0, personal: 0,
  });
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('Estudiante colombiano de 16 años buscando crecer, conectar y aprender en IE University Summer School 2026.');

  return (
    <div style={styles.page}>
      {/* Profile Header */}
      <div style={styles.profileHeader}>
        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>FE</div>
          <div style={styles.avatarGlow} />
        </div>
        <div style={styles.profileInfo}>
          <h1 style={styles.name}>Federico Eckardt Dager</h1>
          <p style={styles.nickname}>Fede · <span style={{ color: 'var(--accent)' }}>IE University Summer 2026</span></p>
          <p style={styles.email}>federicoeckardtd@gmail.com</p>
          <div style={styles.tags}>
            <span style={styles.tag}>📍 Segovia + Madrid</span>
            <span style={styles.tag}>🇨🇴 Colombia</span>
            <span style={styles.tag}>16 años</span>
            <span style={styles.tag}>🤖 AI & Business</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div style={styles.bioCard}>
        <div style={styles.bioHeader}>
          <p style={styles.bioTitle}>Mi Bio en IE</p>
          <button style={styles.editBtn} onClick={() => setEditing(!editing)}>
            {editing ? <Save size={14} /> : <Edit3 size={14} />}
            {editing ? 'Guardar' : 'Editar'}
          </button>
        </div>
        {editing ? (
          <textarea style={styles.bioEditor} value={bio} onChange={e => setBio(e.target.value)} />
        ) : (
          <p style={styles.bioText}>{bio}</p>
        )}
      </div>

      {/* Objectives */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Objetivos del Programa</h2>
        <div style={styles.objectivesGrid}>
          {OBJECTIVES.map(obj => {
            const Icon = obj.icon;
            const statusIdx = progress[obj.id];
            const status = STATUS[statusIdx];
            return (
              <div key={obj.id} style={{ ...styles.objCard, borderColor: obj.color + '33' }}>
                <div style={styles.objTop}>
                  <div style={{ ...styles.objIcon, background: obj.color + '22' }}>
                    <Icon size={16} style={{ color: obj.color }} />
                  </div>
                  <p style={{ ...styles.objLabel, color: obj.color }}>{obj.label}</p>
                  <div style={{ ...styles.statusBadge, background: status.bg, border: `1px solid ${status.border}` }}>
                    <span style={{ fontSize: 11, color: status.color, fontWeight: 600 }}>{status.label}</span>
                  </div>
                </div>
                <p style={styles.objGoal}>{obj.goal}</p>
                <div style={styles.statusBtns}>
                  {STATUS.map((s, i) => (
                    <button
                      key={s.label}
                      style={{
                        ...styles.statusBtn,
                        ...(statusIdx === i ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color } : {}),
                      }}
                      onClick={() => setProgress(p => ({ ...p, [obj.id]: i }))}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Stats */}
      <div style={styles.statsSection}>
        <h2 style={styles.sectionTitle}>El Programa</h2>
        <div style={styles.statsGrid}>
          {[
            { label: 'Total de clases', value: '28', icon: '📚' },
            { label: 'Subjects', value: '8', icon: '🎯' },
            { label: 'Semanas', value: '2', icon: '📅' },
            { label: 'Ciudades', value: '2', icon: '📍' },
            { label: 'Actividades extra', value: '10+', icon: '⚡' },
            { label: 'Agentes IA', value: '3', icon: '🤖' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={styles.statCard}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <p style={styles.statValue}>{value}</p>
              <p style={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  profileHeader: {
    display: 'flex', gap: 28, alignItems: 'flex-start',
    marginBottom: 32,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px',
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 80, height: 80, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, fontWeight: 700, color: '#fff',
    position: 'relative', zIndex: 1,
  },
  avatarGlow: {
    position: 'absolute', inset: -4, borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.2, filter: 'blur(12px)',
  },
  profileInfo: { flex: 1 },
  name: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 },
  nickname: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--mono)' },
  email: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 },
  tags: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tag: {
    fontSize: 11, padding: '4px 10px', borderRadius: 20,
    background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    fontFamily: 'var(--mono)',
  },
  bioCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px', marginBottom: 32,
  },
  bioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bioTitle: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 6,
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 12,
  },
  bioEditor: {
    width: '100%', minHeight: 80, padding: '10px',
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none',
    fontFamily: 'var(--font)', lineHeight: 1.6,
  },
  bioText: { fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--mono)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 },
  objectivesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  objCard: {
    background: 'var(--bg-card)', border: '1px solid',
    borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  objTop: { display: 'flex', alignItems: 'center', gap: 8 },
  objIcon: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  objLabel: { fontSize: 13, fontWeight: 700, flex: 1 },
  statusBadge: { padding: '2px 8px', borderRadius: 20 },
  objGoal: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 },
  statusBtns: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  statusBtn: {
    fontSize: 10, padding: '3px 8px', borderRadius: 20,
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', cursor: 'pointer',
    fontFamily: 'var(--mono)',
  },
  statsSection: { marginBottom: 32 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)' },
  statLabel: { fontSize: 11, color: 'var(--text-muted)' },
};
