// Utilidades de horario derivadas de data/schedule.js. Viven separadas de los
// datos puros para que Dashboard.jsx (y cualquier otra página futura) pueda
// calcular "ahora", conflictos, progreso del día, etc. sin repetir lógica.
//
// IMPORTANTE: las horas de sesión son ESTIMADAS (bloques estándar de 9am),
// igual que en backend/src/data/schedule.js — actualizar ambos si se
// confirma el horario real del programa.

export const WEEK_DAY_DATES = {
  1: {
    Sunday: '2026-06-28', Monday: '2026-06-29', Tuesday: '2026-06-30',
    Wednesday: '2026-07-01', Thursday: '2026-07-02', Friday: '2026-07-03', Saturday: '2026-07-04',
  },
  2: {
    Sunday: '2026-07-05', Monday: '2026-07-06', Tuesday: '2026-07-07',
    Wednesday: '2026-07-08', Thursday: '2026-07-09', Friday: '2026-07-10', Saturday: '2026-07-11',
  },
};

export const SESSION_START_TIMES = { 1: '09:00', 2: '10:30', 3: '12:00', 4: '13:30' };
export const SESSION_DURATION_MIN = 75;

export function getClassDateTime(cls) {
  const dateStr = WEEK_DAY_DATES[cls.week]?.[cls.day];
  const timeStr = SESSION_START_TIMES[cls.session] || '09:00';
  if (!dateStr) return null;
  return new Date(`${dateStr}T${timeStr}:00`);
}

export function getClassEndDateTime(cls) {
  const start = getClassDateTime(cls);
  if (!start) return null;
  return new Date(start.getTime() + SESSION_DURATION_MIN * 60000);
}

// Detecta choques de horario reales (dos clases cuyo rango de tiempo se
// solapa). Con el programa tal como está hoy no debería haber ninguno —
// es infraestructura honesta para el día en que se agreguen eventos
// personales (reservas, entrevistas, etc.) que sí puedan chocar.
export function findScheduleConflicts(classes) {
  const conflicts = [];
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i];
      const b = classes[j];
      const aStart = getClassDateTime(a);
      const aEnd = getClassEndDateTime(a);
      const bStart = getClassDateTime(b);
      const bEnd = getClassEndDateTime(b);
      if (!aStart || !aEnd || !bStart || !bEnd) continue;
      if (aStart < bEnd && bStart < aEnd) conflicts.push([a, b]);
    }
  }
  return conflicts;
}

// % del día de clases ya transcurrido (0 si no empezó, 100 si terminó).
export function getDayProgress(classesToday, now = new Date()) {
  if (!classesToday.length) return null;
  const starts = classesToday.map(getClassDateTime).filter(Boolean);
  const ends = classesToday.map(getClassEndDateTime).filter(Boolean);
  if (!starts.length || !ends.length) return null;
  const dayStart = new Date(Math.min(...starts));
  const dayEnd = new Date(Math.max(...ends));
  if (now <= dayStart) return 0;
  if (now >= dayEnd) return 100;
  return Math.round(((now - dayStart) / (dayEnd - dayStart)) * 100);
}

export function isClassNow(cls, now = new Date()) {
  const start = getClassDateTime(cls);
  const end = getClassEndDateTime(cls);
  if (!start || !end) return false;
  return now >= start && now <= end;
}

// Cuenta de clases por día para la semana dada — alimenta el mapa de
// carga académica.
export function getWeekLoad(week) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dates = WEEK_DAY_DATES[week] || {};
  return days.map((day) => ({ day, date: dates[day] || null }));
}

// Racha de días consecutivos con al menos una reflexión guardada,
// contando hacia atrás desde hoy (o ayer, si hoy aún no se escribió nada).
export function computeStreak(reflectionDates) {
  if (!reflectionDates || !reflectionDates.length) return 0;
  const dateSet = new Set(reflectionDates.map((d) => new Date(d).toDateString()));
  let streak = 0;
  let cursor = new Date();
  if (!dateSet.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
