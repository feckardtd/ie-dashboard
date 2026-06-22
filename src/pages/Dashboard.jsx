import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Bot, BookMarked, MapPin, Calendar, Zap } from 'lucide-react';
import { SUBJECTS, CLASSES } from '../data/schedule';

const WEEK1_START = new Date('2026-06-28');
const WEEK2_START = new Date('2026-07-05');

function getCurrentWeek() {
  const now = new Date();
  if (now >= WEEK1_START && now < WEEK2_START) return 1;
  if (now >= WEEK2_START) return 2;
  return null;
}

function getCurrentLocation() {
  const w = getCurrentWeek();
  if (w === 1) return 'Segovia';
  if (w === 2) return 'Madrid';
  return null;
}

function getDaysUntilProgram() {
  const now = new Date();
  const diff = WEEK1_START - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [stats, setStats] = useState({ notes: 0, contacts: 0 });
  const week = getCurrentWeek();
  const location = getCurrentLocation();
  const daysUntil = getDaysUntilProgram();

  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = week
    ? CLASSES.filter(c => c.week === week && c.day === todayDay)
    : [];

  const STAT_CARDS = [
    { icon: BookOpen, label: 'Clases totales', value: CLASSES.length, color: 'var(--accent)', to: '/clases' },
    { icon: Users, label: 'Contactos', value: stats.contacts, color: 'var(--gold)', to: '/contactos' },
    { icon: Bot, label: 'Agentes activos', value: 3, color: 'var(--green)', to: '/agentes' },
    { icon: BookMarked, label: 'Reflexiones', value: stats.notes, color: '#ec4899', to: '/reflexiones' },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>Buenos días, Fede</p>
          <h1 style={styles.title}>IE University <span style={styles.titleAccent}>Dashboard</span></h1>
        </div>
        <div style={styles.badge}>
          {week ? (
            <>
              <MapPin size={14} style={{ color: 'var(--accent)' }} />
              <span style={styles.badgeText}>Semana {week} — {location}</span>
            </>
          ) : daysUntil > 0 ? (
            <>
              <Calendar size={14} style={{ color: 'var(--gold)' }} />
              <span style={styles.badgeText}>{daysUntil} días para el programa</span>
            </>
          ) : (
            <span style={styles.badgeText}>Programa completado ✅</span>
          )}
        </div>
      </div>

      {/* Countdown or Week Progress */}
      {!week && daysUntil > 0 && (
        <div style={styles.countdown}>
          <div style={styles.countdownInner}>
            <Zap size={20} style={{ color: 'var(--gold)' }} />
            <div>
              <p style={styles.countdownLabel}>El programa comienza en</p>
              <p style={styles.countdownNumber}>{daysUntil} días</p>
            </div>
          </div>
          <p style={styles.countdownSub}>Segovia → Madrid · Junio–Julio 2026</p>
        </div>
      )}

      {/* Stats */}
      <div style={styles.grid4}>
        {STAT_CARDS.map(({ icon: Icon, label, value, color, to }) => (
          <Link to={to} key={label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: color + '22', border: `1px solid ${color}44` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p style={styles.statValue}>{value}</p>
            <p style={styles.statLabel}>{label}</p>
          </Link>
        ))}
      </div>

      {/* Today's Classes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Calendar size={16} style={{ color: 'var(--accent)' }} />
          Clases de hoy
        </h2>
        {todayClasses.length === 0 ? (
          <div style={styles.empty}>
            {week ? 'No hay clases hoy 🎉' : 'El horario se activará cuando comience el programa'}
          </div>
        ) : (
          <div style={styles.classList}>
            {todayClasses.map(cls => {
              const subject = SUBJECTS.find(s => s.id === cls.subjectId);
              return (
                <Link to={`/clases/${cls.id}`} key={cls.id} style={styles.classCard}>
                  <div style={{ ...styles.classBar, background: subject?.color }} />
                  <div style={styles.classInfo}>
                    <p style={styles.className}>{cls.name}</p>
                    <p style={styles.classSubject}>{subject?.icon} {subject?.name} · Sesión {cls.session}</p>
                  </div>
                  <div style={styles.classArrow}>→</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Subjects Overview */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          Subjects del programa
        </h2>
        <div style={styles.subjectGrid}>
          {SUBJECTS.map(s => {
            const count = CLASSES.filter(c => c.subjectId === s.id).length;
            return (
              <Link to={`/clases?subject=${s.id}`} key={s.id} style={styles.subjectCard}>
                <div style={{ ...styles.subjectIcon, background: s.color + '22' }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                </div>
                <p style={{ ...styles.subjectName, color: s.color }}>{s.name}</p>
                <p style={styles.subjectCount}>{count} clases</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 40px 60px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' },
  titleAccent: { color: 'var(--accent)' },
  badge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8,
    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
  },
  badgeText: { fontSize: 13, color: 'var(--accent)', fontWeight: 500 },
  countdown: {
    background: 'var(--gold-dim)', border: '1px solid #f5c84233',
    borderRadius: 12, padding: '20px 24px', marginBottom: 32,
  },
  countdownInner: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
  countdownLabel: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  countdownNumber: { fontSize: 24, fontWeight: 700, color: 'var(--gold)' },
  countdownSub: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 32 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.15s',
  },
  statIcon: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)' },
  statLabel: { fontSize: 12, color: 'var(--text-muted)' },
  section: { marginBottom: 40 },
  sectionTitle: {
    fontSize: 14, fontWeight: 600, color: 'var(--text-muted)',
    fontFamily: 'var(--mono)', letterSpacing: '1px', textTransform: 'uppercase',
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  empty: {
    padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center',
  },
  classList: { display: 'flex', flexDirection: 'column', gap: 8 },
  classCard: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
  },
  classBar: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  classInfo: { flex: 1, padding: '14px 16px' },
  className: { fontSize: 14, fontWeight: 600, marginBottom: 3 },
  classSubject: { fontSize: 12, color: 'var(--text-muted)' },
  classArrow: { padding: '0 16px', color: 'var(--text-dim)', fontSize: 16 },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  subjectCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  subjectIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 13, fontWeight: 600, lineHeight: 1.3 },
  subjectCount: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
};
