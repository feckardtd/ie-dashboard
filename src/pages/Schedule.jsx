import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SUBJECTS, CLASSES } from '../data/schedule';

// Calendar definition per week. Matches the dates already used in Dashboard.jsx
// (WEEK1_START / WEEK2_START) and Reflexiones.jsx, so all pages stay in sync.
const WEEKS = [
  {
    week: 1,
    label: 'Semana 1 — Segovia',
    location: 'Segovia',
    days: [
      { date: '2026-06-28', day: 'Sunday', label: 'Domingo', short: '28 Jun', special: 'Llegada' },
      { date: '2026-06-29', day: 'Monday', label: 'Lunes', short: '29 Jun' },
      { date: '2026-06-30', day: 'Tuesday', label: 'Martes', short: '30 Jun' },
      { date: '2026-07-01', day: 'Wednesday', label: 'Miércoles', short: '1 Jul' },
      { date: '2026-07-02', day: 'Thursday', label: 'Jueves', short: '2 Jul' },
      { date: '2026-07-03', day: 'Friday', label: 'Viernes', short: '3 Jul' },
      { date: '2026-07-04', day: 'Saturday', label: 'Sábado', short: '4 Jul', special: 'Salida → Madrid' },
    ],
  },
  {
    week: 2,
    label: 'Semana 2 — Madrid',
    location: 'Madrid',
    days: [
      { date: '2026-07-05', day: 'Sunday', label: 'Domingo', short: '5 Jul', special: 'Warner Bros' },
      { date: '2026-07-06', day: 'Monday', label: 'Lunes', short: '6 Jul' },
      { date: '2026-07-07', day: 'Tuesday', label: 'Martes', short: '7 Jul' },
      { date: '2026-07-08', day: 'Wednesday', label: 'Miércoles', short: '8 Jul' },
      { date: '2026-07-09', day: 'Thursday', label: 'Jueves', short: '9 Jul' },
      { date: '2026-07-10', day: 'Friday', label: 'Viernes', short: '10 Jul', special: 'Graduation' },
      { date: '2026-07-11', day: 'Saturday', label: 'Sábado', short: '11 Jul', special: 'Salida' },
    ],
  },
];

function classesFor(week, dayName) {
  return CLASSES
    .filter(c => c.week === week && c.day === dayName)
    .sort((a, b) => a.session - b.session);
}

export default function Schedule() {
  const [activeWeek, setActiveWeek] = useState(1);
  const current = WEEKS.find(w => w.week === activeWeek);

  return (
    <div className="page-pad" style={styles.page}>
      <h1 style={styles.title}>Schedule <span style={{ color: 'var(--accent)' }}>Visual</span></h1>
      <p style={styles.sub}>Vista semanal del programa · click en una clase para ver notas</p>

      {/* Week tabs */}
      <div style={styles.tabs}>
        {WEEKS.map(w => (
          <button
            key={w.week}
            style={{ ...styles.tab, ...(activeWeek === w.week ? styles.tabActive : {}) }}
            onClick={() => setActiveWeek(w.week)}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Subject legend */}
      <div style={styles.legend}>
        {SUBJECTS.map(s => (
          <div key={s.id} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: s.color }} />
            <span style={styles.legendLabel}>{s.icon} {s.name}</span>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div style={styles.grid}>
        {current.days.map(d => {
          const dayClasses = classesFor(current.week, d.day);
          return (
            <div key={d.date} style={styles.dayCol}>
              <div style={styles.dayHeader}>
                <p style={styles.dayName}>{d.label}</p>
                <p style={styles.dayDate}>{d.short}</p>
                {d.special && <p style={styles.daySpecial}>{d.special}</p>}
              </div>
              <div style={styles.dayBody}>
                {dayClasses.length === 0 && (
                  <p style={styles.emptyDay}>{d.special ? '—' : 'Sin clases'}</p>
                )}
                {dayClasses.map(cls => {
                  const subject = SUBJECTS.find(s => s.id === cls.subjectId);
                  return (
                    <Link
                      to={`/clases/${cls.id}`}
                      key={cls.id}
                      style={{
                        ...styles.classCard,
                        background: subject?.color + '1a',
                        borderColor: subject?.color + '55',
                      }}
                    >
                      <span style={{ ...styles.classDot, background: subject?.color }} />
                      <div>
                        <p style={{ ...styles.classSubject, color: subject?.color }}>
                          {subject?.icon} {subject?.name}
                        </p>
                        <p style={styles.className}>{cls.name}</p>
                        <p style={styles.classSession}>Sesión {cls.session}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 24 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer',
  },
  tabActive: {
    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', color: 'var(--accent)',
  },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28,
    padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontSize: 11, color: 'var(--text-muted)' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: 10,
    overflowX: 'auto',
  },
  dayCol: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
    display: 'flex', flexDirection: 'column', minHeight: 220,
  },
  dayHeader: {
    padding: '12px 12px 10px', borderBottom: '1px solid var(--border)',
  },
  dayName: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  dayDate: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 2 },
  daySpecial: { fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--mono)', marginTop: 4 },
  dayBody: { flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 },
  emptyDay: { fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 20 },
  classCard: {
    display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid',
  },
  classDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5 },
  classSubject: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 3 },
  className: { fontSize: 11.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 2 },
  classSession: { fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
};
