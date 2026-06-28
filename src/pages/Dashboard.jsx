import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Bot, MapPin, Calendar, Zap, Flame, ShieldCheck, Clock } from 'lucide-react';
import { SUBJECTS, CLASSES } from '../data/schedule';
import { getReflections, getCampScheduleToday } from '../lib/supabase';
import {
  WEEK_DAY_DATES,
  getDayProgress,
  isClassNow,
  findScheduleConflicts,
  computeStreak,
} from '../lib/scheduleUtils';

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

// CampOrganizer's cached payload is keyed by calendar date in Europe/Madrid
// (where the program actually happens), so "today" needs to be computed in
// that timezone too — otherwise a UTC-based "today" can be off by a few
// hours right around midnight and show/hide the wrong cached day.
function getMadridDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d);
}

// CampOrganizer event_type_snapshot.color values are Tailwind-style color
// names (violet, sky, etc.) — map them to the actual hex used elsewhere in
// this dashboard's palette so the real schedule visually matches the rest
// of the UI instead of using raw CSS color names.
const CAMP_TYPE_COLORS = {
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  green: '#22c55e',
  orange: '#f97316',
  amber: '#f5c842',
  rose: '#f43f5e',
  pink: '#ec4899',
  red: '#ef4444',
  blue: '#3b82f6',
  teal: '#14b8a6',
  gray: '#6b7280',
};

function campColorFor(name) {
  return CAMP_TYPE_COLORS[name] || 'var(--accent)';
}

// Mapa de carga académica: cuenta de clases por día de la semana en curso.
// Es el elemento de firma de este rediseño — convierte el horario en una
// sensación inmediata de "dónde se me acumula la semana".
function WeekLoadMap({ week }) {
  if (!week) return null;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabels = { Monday: 'L', Tuesday: 'M', Wednesday: 'X', Thursday: 'J', Friday: 'V', Saturday: 'S', Sunday: 'D' };
  const dates = WEEK_DAY_DATES[week] || {};
  const todayStr = new Date().toDateString();
  const counts = days.map((day) => CLASSES.filter((c) => c.week === week && c.day === day).length);
  const max = Math.max(...counts, 1);

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        <Zap size={16} style={{ color: 'var(--accent)' }} />
        Mapa de carga · Semana {week}
      </h2>
      <div style={styles.heatRow}>
        {days.map((day, i) => {
          const count = counts[i];
          const opacity = count === 0 ? 0 : 0.35 + (count / max) * 0.55;
          const dateStr = dates[day];
          const isToday = dateStr && new Date(dateStr).toDateString() === todayStr;
          return (
            <div
              key={day}
              title={`${day}: ${count} clase${count === 1 ? '' : 's'}`}
              style={{
                ...styles.heatCell,
                background: count === 0 ? 'var(--bg-card)' : `rgba(200,99,42,${opacity})`,
                border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <span style={styles.heatLabel}>{dayLabels[day]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Anillo de progreso del día: qué porcentaje del bloque de clases de hoy ya
// pasó. Usa horarios estimados (ver scheduleUtils.js) — honesto sobre eso
// si alguna vez se confirma el horario real.
function DayProgressRing({ percent }) {
  if (percent === null) return null;
  const r = 19;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
      <svg width="46" height="46" viewBox="0 0 46 46">
        <circle cx="23" cy="23" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="23" cy="23" r={r} fill="none" stroke="var(--accent)" strokeWidth="5"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 23 23)"
        />
      </svg>
      <span style={styles.ringLabel}>{percent}%</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats] = useState({ notes: 0, contacts: 0 });
  const [streak, setStreak] = useState(0);
  const [campSchedule, setCampSchedule] = useState(null); // { date, fetchedAt, events: [] } | null | 'stale'
  const week = getCurrentWeek();
  const location = getCurrentLocation();
  const daysUntil = getDaysUntilProgram();
  const now = new Date();

  useEffect(() => {
    getReflections().then(({ data }) => {
      if (data) setStreak(computeStreak(data.map((r) => r.date)));
    });
  }, []);

  useEffect(() => {
    getCampScheduleToday().then(({ data, error }) => {
      if (error || !data?.payload) return;
      const todayStr = getMadridDateStr();
      if (data.date !== todayStr) {
        // El cache existe pero es de otro día (ej. el job de Railway todavía
        // no corrió hoy) — lo marcamos "stale" en vez de mostrar datos viejos
        // como si fueran de hoy.
        setCampSchedule('stale');
        return;
      }
      const events = (data.payload.events || [])
        .filter((e) => e.visibility?.explorer && e.status !== 'canceled')
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
      setCampSchedule({ date: data.date, fetchedAt: data.fetched_at, events });
    });
  }, []);

  const todayDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = week
    ? CLASSES.filter(c => c.week === week && c.day === todayDay)
    : [];
  const dayProgress = getDayProgress(todayClasses, now);
  const conflicts = findScheduleConflicts(CLASSES.filter(c => c.week === week));

  const STAT_CARDS = [
    { icon: BookOpen, label: 'Clases totales', value: CLASSES.length, color: 'var(--accent)', to: '/clases' },
    { icon: Users, label: 'Contactos', value: stats.contacts, color: 'var(--blue)', to: '/contactos' },
    { icon: Bot, label: 'Agentes activos', value: 8, color: 'var(--green)', to: '/agentes' },
    { icon: Flame, label: 'Racha de reflexión', value: `${streak}d`, color: 'var(--gold)', to: '/reflexiones' },
  ];

  return (
    <div className="page-pad" style={styles.page}>
      {/* Header */}
      <div className="stack-mobile" style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {dayProgress !== null && <DayProgressRing percent={dayProgress} />}
          <div>
            <p style={styles.greeting}>Buenos días, Fede</p>
            <h1 style={styles.title}>IE University <span style={styles.titleAccent}>Dashboard</span></h1>
          </div>
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

      {/* Segovia → Madrid timeline */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <MapPin size={16} style={{ color: 'var(--accent)' }} />
          Segovia → Madrid
        </h2>
        <div style={styles.timelineRow}>
          {[1, 2].map((w) => Object.entries(WEEK_DAY_DATES[w]).map(([day, dateStr]) => {
            const date = new Date(dateStr);
            const isToday = date.toDateString() === now.toDateString();
            const loc = w === 1 ? 'Segovia' : 'Madrid';
            return (
              <div
                key={dateStr}
                title={`${day} ${dateStr} · ${loc}`}
                style={{
                  ...styles.timelineCell,
                  background: w === 1 ? 'var(--green-dim)' : 'var(--blue-dim)',
                  border: isToday ? '2px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <span style={{ ...styles.timelineDay, color: w === 1 ? 'var(--green)' : 'var(--blue)' }}>
                  {date.getDate()}
                </span>
              </div>
            );
          }))}
        </div>
        <div style={styles.timelineLegend}>
          <span><span style={{ ...styles.legendDot, background: 'var(--green)' }} /> Segovia (semana 1)</span>
          <span><span style={{ ...styles.legendDot, background: 'var(--blue)' }} /> Madrid (semana 2)</span>
        </div>
      </div>

      {/* Stats */}
      <div className="responsive-grid" style={styles.grid4}>
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

      {/* Week load map */}
      <WeekLoadMap week={week} />

      {/* Conflict status */}
      <div style={styles.conflictBadge}>
        <ShieldCheck size={14} style={{ color: conflicts.length ? 'var(--red)' : 'var(--green)' }} />
        <span style={{ color: conflicts.length ? 'var(--red)' : 'var(--text-muted)' }}>
          {conflicts.length
            ? `${conflicts.length} choque${conflicts.length === 1 ? '' : 's'} de horario detectado${conflicts.length === 1 ? '' : 's'}`
            : 'Sin choques de horario esta semana'}
        </span>
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
              const happeningNow = isClassNow(cls, now);
              return (
                <Link to={`/clases/${cls.id}`} key={cls.id} style={styles.classCard}>
                  <div style={{ ...styles.classBar, background: subject?.color }} />
                  <div style={styles.classInfo}>
                    <p style={styles.className}>{cls.name}</p>
                    <p style={styles.classSubject}>{subject?.icon} {subject?.name} · Sesión {cls.session}</p>
                  </div>
                  {happeningNow && <span style={styles.nowChip}>AHORA</span>}
                  <div style={styles.classArrow}>→</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CampOrganizer real schedule (actividades, comidas, transporte) */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Clock size={16} style={{ color: 'var(--accent)' }} />
          Horario real de hoy · CampOrganizer
        </h2>
        {campSchedule === null ? (
          <div style={styles.empty}>Cargando horario real…</div>
        ) : campSchedule === 'stale' ? (
          <div style={styles.empty}>Todavía no hay horario sincronizado para hoy (se actualiza ~6:30 AM)</div>
        ) : campSchedule.events.length === 0 ? (
          <div style={styles.empty}>No hay eventos para hoy en CampOrganizer</div>
        ) : (
          <div style={styles.classList}>
            {campSchedule.events.map((ev) => {
              const color = campColorFor(ev.event_type_snapshot?.color);
              return (
                <div key={ev._id} style={styles.classCard}>
                  <div style={{ ...styles.classBar, background: color }} />
                  <div style={styles.classInfo}>
                    <p style={styles.className}>{ev.title}</p>
                    <p style={styles.classSubject}>
                      {ev.start_time_local}–{ev.end_time_local}
                      {ev.location?.name ? ` · ${ev.location.name}` : ''}
                    </p>
                  </div>
                  {ev.status === 'in_progress' && <span style={styles.nowChip}>AHORA</span>}
                </div>
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
        <div className="responsive-grid" style={styles.subjectGrid}>
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
  title: { fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px' },
  titleAccent: { color: 'var(--accent)' },
  badge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8,
    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
  },
  badgeText: { fontSize: 13, color: 'var(--accent)', fontWeight: 500 },
  countdown: {
    background: 'var(--gold-dim)', border: '1px solid #b8862e33',
    borderRadius: 12, padding: '20px 24px', marginBottom: 32,
  },
  countdownInner: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
  countdownLabel: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  countdownNumber: { fontSize: 24, fontWeight: 600, color: 'var(--gold)' },
  countdownSub: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 32 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.15s',
  },
  statIcon: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: 600, fontFamily: 'var(--mono)' },
  statLabel: { fontSize: 12, color: 'var(--text-muted)' },
  section: { marginBottom: 32 },
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
  nowChip: {
    fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--accent)',
    background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: 5,
    marginRight: 8, letterSpacing: '0.5px',
  },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  subjectCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  subjectIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 13, fontWeight: 600, lineHeight: 1.3 },
  subjectCount: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  heatRow: { display: 'flex', gap: 4 },
  heatCell: {
    flex: 1, height: 40, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  heatLabel: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)' },
  ringLabel: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)',
  },
  timelineRow: { display: 'flex', gap: 3, flexWrap: 'wrap' },
  timelineCell: {
    width: 30, height: 30, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  timelineDay: { fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500 },
  timelineLegend: { display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-muted)' },
  legendDot: { display: 'inline-block', width: 7, height: 7, borderRadius: 2, marginRight: 5 },
  conflictBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)',
    marginBottom: 32, marginTop: -16,
  },
};
