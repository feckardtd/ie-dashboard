import React, { useState, useEffect } from 'react';
import { Tent, Cloud, CalendarDays, MapPin, Clock } from 'lucide-react';
import { getCampScheduleToday } from '../lib/supabase';

function getMadridDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d);
}

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

const STATUS_LABELS = {
  planned: { label: 'Planeado', color: 'var(--text-muted)' },
  in_progress: { label: 'AHORA', color: 'var(--accent)' },
  finished: { label: 'Terminado', color: 'var(--green)' },
  canceled: { label: 'Cancelado', color: 'var(--red)' },
};

const SESSION_STATUS_LABELS = {
  'In Progress': 'En curso',
  'Not Started': 'No iniciada',
  'Finished': 'Finalizada',
};

function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CampOrganizer() {
  const [state, setState] = useState(null); // 'loading' | 'stale' | 'empty' | { day, events, session }

  useEffect(() => {
    getCampScheduleToday().then(({ data, error }) => {
      if (error || !data?.payload) {
        setState('empty');
        return;
      }
      const todayStr = getMadridDateStr();
      if (data.date !== todayStr) {
        setState('stale');
        return;
      }
      const day = data.payload.days?.[0];
      const events = (data.payload.events || [])
        .filter((e) => e.visibility?.explorer)
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
      setState({ day, events, session: data.payload.session, fetchedAt: data.fetched_at });
    });
  }, []);

  if (state === null) {
    return (
      <div className="page-pad" style={styles.page}>
        <div style={styles.empty}>Cargando datos de CampOrganizer…</div>
      </div>
    );
  }

  if (state === 'stale') {
    return (
      <div className="page-pad" style={styles.page}>
        <h1 style={styles.title}>
          <Tent size={26} style={{ color: 'var(--accent)' }} /> CampOrganizer
        </h1>
        <div style={styles.empty}>
          Todavía no hay datos sincronizados para hoy (el job de Railway corre ~6:30 AM hora de Madrid).
          Volvé a revisar más tarde.
        </div>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="page-pad" style={styles.page}>
        <h1 style={styles.title}>
          <Tent size={26} style={{ color: 'var(--accent)' }} /> CampOrganizer
        </h1>
        <div style={styles.empty}>No hay datos de CampOrganizer disponibles todavía.</div>
      </div>
    );
  }

  const { day, events, session } = state;
  const weather = day?.weather;
  const sessionStatus = SESSION_STATUS_LABELS[session?.status] || session?.status;

  return (
    <div className="page-pad" style={styles.page}>
      <h1 style={styles.title}>
        <Tent size={26} style={{ color: 'var(--accent)' }} /> CampOrganizer
      </h1>
      <p style={styles.sub}>Extensión de la app real de CampOrganizer · datos en vivo de hoy</p>

      {/* Session info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <CalendarDays size={16} style={{ color: 'var(--accent)' }} />
          Sesión
        </h2>
        <div style={styles.sessionCard}>
          <div>
            <p style={styles.sessionName}>{session?.name || 'Sesión sin nombre'}</p>
            <p style={styles.sessionDates}>
              {formatDateLong(session?.start_date)} → {formatDateLong(session?.finish_date)}
            </p>
          </div>
          <span style={styles.sessionStatus}>{sessionStatus}</span>
        </div>
      </div>

      {/* Weather */}
      {weather && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Cloud size={16} style={{ color: 'var(--accent)' }} />
            Clima · {day?.title || 'Hoy'}
          </h2>
          <div style={styles.weatherCard}>
            <img
              src={`https://my.camporganizer.app/icons/weather/${weather.icon}.svg`}
              alt={weather.condition || 'clima'}
              width={56}
              height={56}
              style={{ flexShrink: 0 }}
            />
            <div style={styles.weatherMain}>
              <p style={styles.weatherTemp}>{Math.round(weather.temp_day)}°C</p>
              <p style={styles.weatherDesc}>{weather.description || weather.condition || weather.summary}</p>
            </div>
            <div style={styles.weatherDetails}>
              <span>Mín {Math.round(weather.temp_min)}° · Máx {Math.round(weather.temp_max)}°</span>
              <span>Humedad {weather.humidity}%</span>
              {weather.wind_speed != null && <span>Viento {Math.round(weather.wind_speed)} km/h</span>}
              {weather.uvi != null && <span>UV {weather.uvi}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Day info */}
      {day && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <MapPin size={16} style={{ color: 'var(--accent)' }} />
            {day.title} {day.location ? `· ${day.location}` : ''}
          </h2>
          {day.description && <p style={styles.dayDescription}>{day.description}</p>}
        </div>
      )}

      {/* Full agenda */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <Clock size={16} style={{ color: 'var(--accent)' }} />
          Agenda completa de hoy
        </h2>
        {events.length === 0 ? (
          <div style={styles.empty}>No hay eventos para hoy</div>
        ) : (
          <div style={styles.eventList}>
            {events.map((ev) => {
              const color = campColorFor(ev.event_type_snapshot?.color);
              const status = STATUS_LABELS[ev.status] || { label: ev.status, color: 'var(--text-muted)' };
              return (
                <div key={ev._id} style={styles.eventCard}>
                  <div style={{ ...styles.eventBar, background: color }} />
                  <div style={styles.eventBody}>
                    <div style={styles.eventHeader}>
                      <p style={styles.eventTitle}>
                        {ev.event_type_snapshot?.icon ? `${ev.event_type_snapshot.icon} ` : ''}
                        {ev.title}
                      </p>
                      <span style={{ ...styles.eventStatus, color: status.color }}>{status.label}</span>
                    </div>
                    <p style={styles.eventMeta}>
                      {ev.start_time_local}–{ev.end_time_local}
                      {ev.location?.name ? ` · ${ev.location.name}` : ''}
                    </p>
                    {ev.description && <p style={styles.eventDescription}>{ev.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px 40px 60px' },
  title: {
    fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 6,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 28 },
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
  sessionCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
  },
  sessionName: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  sessionDates: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  sessionStatus: {
    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)',
    background: 'var(--accent-dim)', padding: '5px 10px', borderRadius: 6, letterSpacing: '0.5px',
  },
  weatherCard: {
    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
  },
  weatherMain: { display: 'flex', flexDirection: 'column', gap: 2 },
  weatherTemp: { fontSize: 26, fontWeight: 600, fontFamily: 'var(--mono)' },
  weatherDesc: { fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' },
  weatherDetails: {
    display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 'auto',
    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)',
  },
  dayDescription: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '16px 20px', fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
  },
  eventList: { display: 'flex', flexDirection: 'column', gap: 10 },
  eventCard: {
    display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 10, overflow: 'hidden',
  },
  eventBar: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  eventBody: { flex: 1, padding: '14px 18px' },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 },
  eventTitle: { fontSize: 14, fontWeight: 600 },
  eventStatus: { fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.5px', flexShrink: 0 },
  eventMeta: { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  eventDescription: { fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
};
