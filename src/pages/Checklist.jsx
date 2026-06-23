import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plane } from 'lucide-react';

// Checklist pre-viaje para el IE University Summer School 2026 (Segovia → Madrid,
// 28 jun – 11 jul). Categorías pensadas para un programa de 2 semanas con
// componente de hackathon/pitch y clima de verano en España. Persistencia simple
// en localStorage — es personal, de un solo dispositivo, no necesita Supabase.
const STORAGE_KEY = 'ie-checklist-2026';

const SECTIONS = [
  {
    title: '📄 Documentos',
    items: [
      'Pasaporte (vigencia mínima 6 meses tras el regreso)',
      'Visa Schengen si aplica, impresa y digital',
      'Carta de aceptación / confirmación del programa IE',
      'Seguro de viaje y médico internacional (póliza impresa + número de emergencia)',
      'Copias digitales de todo lo anterior (foto + email a ti mismo)',
      'Contacto de emergencia de un familiar guardado y compartido con IE',
    ],
  },
  {
    title: '🎒 Equipaje',
    items: [
      'Ropa ligera para Segovia/Madrid en verano (calor seco, 25-35°C)',
      'Una muda formal para el pitch final / graduación',
      'Adaptador de enchufe europeo (tipo C/F)',
      'Cargador y power bank',
      'Medicamentos personales + copia de receta si aplica',
      'Artículos de higiene básicos',
      'Mochila pequeña para excursiones del día',
    ],
  },
  {
    title: '💳 Dinero y conectividad',
    items: [
      'Tarjeta internacional habilitada para España (avisar al banco)',
      'Algo de efectivo en euros para el primer día',
      'Plan de roaming internacional o eSIM activada antes de llegar',
      'Apps de pago (Telegram ya configurado con el bot del dashboard)',
    ],
  },
  {
    title: '🧠 Mentalidad / antes de llegar',
    items: [
      'Revisar el Schedule del programa en el dashboard',
      'Pensar en 1-2 metas concretas (ver Mi Perfil → Objetivos)',
      'Practicar una presentación corta de 30s sobre ti en inglés',
      'Avisar a la familia el itinerario de vuelos y fechas clave',
    ],
  },
];

function loadChecked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function Checklist() {
  const [checked, setChecked] = useState(loadChecked);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggle = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const allItems = SECTIONS.flatMap((s) => s.items);
  const doneCount = allItems.filter((_, i) => checked[allItems[i]]).length;
  const total = allItems.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="page-pad" style={styles.page}>
      <h1 style={styles.title}>Checklist <span style={{ color: 'var(--accent)' }}>Pre-Viaje</span></h1>
      <p style={styles.sub}>Segovia → Madrid · 28 jun – 11 jul 2026</p>

      <div style={styles.progressCard}>
        <div style={styles.progressTop}>
          <Plane size={16} style={{ color: 'var(--accent)' }} />
          <span style={styles.progressText}>{doneCount} de {total} listos</span>
          <span style={styles.progressPct}>{pct}%</span>
        </div>
        <div style={styles.progressBarBg}>
          <div style={{ ...styles.progressBarFill, width: `${pct}%` }} />
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} style={styles.section}>
          <h2 style={styles.sectionTitle}>{section.title}</h2>
          <div style={styles.itemList}>
            {section.items.map((item) => {
              const isChecked = !!checked[item];
              return (
                <button
                  key={item}
                  style={{ ...styles.item, ...(isChecked ? styles.itemDone : {}) }}
                  onClick={() => toggle(item)}
                >
                  {isChecked ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  )}
                  <span style={{ ...styles.itemText, ...(isChecked ? styles.itemTextDone : {}) }}>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 28 },
  progressCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '18px 20px', marginBottom: 32,
  },
  progressTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressText: { fontSize: 13, fontWeight: 600, flex: 1 },
  progressPct: { fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 },
  progressBarBg: { height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.2s' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12 },
  itemList: { display: 'flex', flexDirection: 'column', gap: 6 },
  item: {
    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
    padding: '12px 14px', borderRadius: 8,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    width: '100%',
  },
  itemDone: { borderColor: 'var(--green)', background: 'var(--green-dim)' },
  itemText: { fontSize: 13, color: 'var(--text)', lineHeight: 1.4 },
  itemTextDone: { color: 'var(--text-muted)', textDecoration: 'line-through' },
};
