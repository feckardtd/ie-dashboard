import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Trash2, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { uploadGalleryPhoto, savePhoto, getPhotos, deletePhoto } from '../lib/supabase';

export default function Fotos() {
  const [photos, setPhotos] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [category, setCategory] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getPhotos().then(({ data }) => { if (data) setPhotos(data); });
  }, []);

  const categories = Array.from(new Set(photos.map(p => p.category))).sort();

  const filtered = activeCategory === 'Todas'
    ? photos
    : photos.filter(p => p.category === activeCategory);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setCategory('');
    setCaption('');
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const finalCategory = category.trim() || 'Sin categoría';
    const { url, path, error: upErr } = await uploadGalleryPhoto(finalCategory, pendingFile);
    if (!upErr && url) {
      const { data } = await savePhoto({ url, path, category: finalCategory, caption });
      if (data?.[0]) setPhotos(prev => [data[0], ...prev]);
    }
    setUploading(false);
    setShowUpload(false);
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (photo) => {
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    setLightbox(null);
    await deletePhoto(photo.id, photo.path);
  };

  return (
    <div className="page-pad" style={styles.page}>
      <div className="stack-mobile" style={styles.header}>
        <div>
          <h1 style={styles.title}>Fotos <span style={{ color: 'var(--accent)' }}>IE '26</span></h1>
          <p style={styles.sub}>{photos.length} fotos guardadas</p>
        </div>
        <button style={styles.addBtn} onClick={() => fileInputRef.current?.click()}>
          <Upload size={16} /> Subir foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePick}
        />
      </div>

      {/* Category tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeCategory === 'Todas' ? styles.tabActive : {}) }}
          onClick={() => setActiveCategory('Todas')}
        >
          Todas ({photos.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            style={{ ...styles.tab, ...(activeCategory === cat ? styles.tabActive : {}) }}
            onClick={() => setActiveCategory(cat)}
          >
            {cat} ({photos.filter(p => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <Camera size={32} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {photos.length === 0
              ? 'Aún no subiste fotos. ¡Subí la primera!'
              : 'No hay fotos en esta categoría.'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(p => (
            <div key={p.id} style={styles.thumbWrap} onClick={() => setLightbox(p)}>
              <img src={p.url} alt={p.caption || p.category} style={styles.thumb} />
              <span style={styles.thumbCategory}>{p.category}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && !uploading && setShowUpload(false)}>
          <div className="modal-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Subir foto</h2>
              <button style={styles.closeBtn} onClick={() => setShowUpload(false)} disabled={uploading}>
                <X size={16} />
              </button>
            </div>

            {pendingPreview && (
              <img src={pendingPreview} alt="preview" style={styles.previewImg} />
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <FolderPlus size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Categoría
              </label>
              <input
                style={styles.input}
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Segovia, Hackathon, Amigos... (o creá una nueva)"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Descripción (opcional)</label>
              <input
                style={styles.input}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="¿Qué es esta foto?"
              />
            </div>

            <button style={styles.saveBtn} onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Guardar foto'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setLightbox(null)}>
          <div style={styles.lightboxWrap}>
            <div style={styles.lightboxHeader}>
              <span style={styles.lightboxCategory}>
                <ImageIcon size={14} /> {lightbox.category}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={styles.lightboxBtn} onClick={() => handleDelete(lightbox)}>
                  <Trash2 size={16} />
                </button>
                <button style={styles.lightboxBtn} onClick={() => setLightbox(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <img src={lightbox.url} alt={lightbox.caption || lightbox.category} style={styles.lightboxImg} />
            {lightbox.caption && <p style={styles.lightboxCaption}>{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 8,
    background: 'var(--accent)', border: 'none', color: '#fff',
    fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
  tab: {
    padding: '6px 14px', borderRadius: 20,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer',
  },
  tabActive: {
    color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 0', color: 'var(--text-muted)',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12,
  },
  thumbWrap: {
    position: 'relative', borderRadius: 10, overflow: 'hidden',
    border: '1px solid var(--border)', cursor: 'pointer', aspectRatio: '1',
    background: 'var(--bg-card)',
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbCategory: {
    position: 'absolute', bottom: 6, left: 6,
    fontSize: 10, fontFamily: 'var(--mono)', color: '#fff',
    background: '#000000aa', padding: '3px 8px', borderRadius: 6,
  },
  overlay: {
    position: 'fixed', inset: 0, background: '#00000088',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '28px', width: 420, maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 },
  previewImg: {
    width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 18,
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' },
  input: {
    padding: '10px 12px', background: 'var(--bg)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  },
  saveBtn: {
    width: '100%', padding: '12px', borderRadius: 8,
    background: 'var(--accent)', border: 'none', color: '#fff',
    fontSize: 14, fontWeight: 700, marginTop: 8,
  },
  lightboxWrap: { maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 10 },
  lightboxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lightboxCategory: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontFamily: 'var(--mono)', color: '#fff',
  },
  lightboxBtn: {
    background: '#ffffff22', border: 'none', borderRadius: 8,
    color: '#fff', padding: 8, cursor: 'pointer',
  },
  lightboxImg: { maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: 10 },
  lightboxCaption: { color: '#fff', fontSize: 13, textAlign: 'center' },
};
