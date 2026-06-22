import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Globe, Users } from 'lucide-react';
import { saveContact, getContacts } from '../lib/supabase';

const EMPTY_CONTACT = {
  name: '', country: '', email: '',
  instagram: '', snapchat: '', linkedin: '', slack: '', phone: '', notes: '',
};

export default function Contactos() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContacts().then(({ data }) => { if (data) setContacts(data); });
  }, []);

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.country?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const { data } = await saveContact({ ...form, id: form.id || undefined });
    if (data?.[0]) {
      setContacts(prev => {
        const idx = prev.findIndex(c => c.id === data[0].id);
        if (idx >= 0) { const n = [...prev]; n[idx] = data[0]; return n; }
        return [data[0], ...prev];
      });
    }
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_CONTACT);
  };

  const SOCIAL_FIELDS = [
    { key: 'instagram', label: 'Instagram', placeholder: '@username', color: '#e1306c' },
    { key: 'snapchat', label: 'Snapchat', placeholder: 'username', color: '#fffc00' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/...', color: '#0077b5' },
    { key: 'slack', label: 'Slack (IE)', placeholder: '@nombre en IE workspace', color: '#4a154b' },
    { key: 'phone', label: 'Teléfono', placeholder: '+1 234 567 8900', color: 'var(--green)' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Contactos <span style={{ color: 'var(--accent)' }}>IE '26</span></h1>
          <p style={styles.sub}>{contacts.length} personas conectadas en el programa</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setForm(EMPTY_CONTACT); setShowForm(true); }}>
          <Plus size={16} /> Agregar contacto
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          style={styles.searchInput}
          placeholder="Buscar por nombre o país..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Contact Grid */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <Users size={32} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {contacts.length === 0
              ? 'Aún no tienes contactos. ¡Agrega el primero cuando llegues a IE!'
              : 'No hay contactos que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(c => (
            <div key={c.id} style={styles.card} onClick={() => { setForm(c); setShowForm(true); }}>
              <div style={styles.avatar}>
                {c.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={styles.cardInfo}>
                <p style={styles.cardName}>{c.name}</p>
                {c.country && <p style={styles.cardCountry}><Globe size={10} /> {c.country}</p>}
              </div>
              <div style={styles.socials}>
                {c.instagram && <span style={{ ...styles.socialTag, color: '#e1306c', background: '#e1306c22' }}>IG</span>}
                {c.snapchat && <span style={{ ...styles.socialTag, color: '#b8a800', background: '#fffc0022' }}>SC</span>}
                {c.slack && <span style={{ ...styles.socialTag, color: '#9b59b6', background: '#4a154b22' }}>SL</span>}
                {c.linkedin && <span style={{ ...styles.socialTag, color: '#0077b5', background: '#0077b522' }}>LI</span>}
              </div>
              {c.notes && <p style={styles.cardNotes}>{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{form.id ? 'Editar contacto' : 'Nuevo contacto'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre *</label>
                <input style={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>País / Ciudad</label>
                <input style={styles.input} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="México, España, Colombia..." />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
              </div>
            </div>

            <div style={styles.socialsSection}>
              <p style={styles.socialsTitle}>Redes Sociales</p>
              {SOCIAL_FIELDS.map(({ key, label, placeholder, color }) => (
                <div key={key} style={styles.socialRow}>
                  <span style={{ ...styles.socialLabel, color }}>{label}</span>
                  <input
                    style={styles.socialInput}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notas personales</label>
              <textarea
                style={{ ...styles.input, height: 80, resize: 'vertical' }}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Qué hace, cómo se conectaron, ideas para el Hackathon juntos..."
              />
            </div>

            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar contacto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 8,
    background: 'var(--accent)', border: 'none', color: '#fff',
    fontSize: 13, fontWeight: 600,
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 14px', marginBottom: 24,
  },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 0', color: 'var(--text-muted)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700, color: 'var(--accent)',
  },
  cardInfo: {},
  cardName: { fontSize: 15, fontWeight: 700 },
  cardCountry: { fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 },
  socials: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  socialTag: { fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--mono)', fontWeight: 700 },
  cardNotes: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 8 },
  overlay: {
    position: 'fixed', inset: 0, background: '#00000088',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px', width: 520, maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 },
  label: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' },
  input: {
    padding: '10px 12px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  },
  socialsSection: { marginBottom: 20 },
  socialsTitle: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 },
  socialRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  socialLabel: { fontSize: 12, fontWeight: 700, width: 70, flexShrink: 0, fontFamily: 'var(--mono)' },
  socialInput: {
    flex: 1, padding: '8px 12px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, outline: 'none',
  },
  saveBtn: {
    width: '100%', padding: '12px', borderRadius: 8,
    background: 'var(--accent)', border: 'none', color: '#fff',
    fontSize: 14, fontWeight: 700, marginTop: 8,
  },
};
