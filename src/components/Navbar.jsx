import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Users, Bot, BookMarked, User, Plane } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/clases', icon: BookOpen, label: 'Clases' },
  { to: '/contactos', icon: Users, label: 'Contactos' },
  { to: '/agentes', icon: Bot, label: 'Agentes' },
  { to: '/reflexiones', icon: BookMarked, label: 'Reflexiones' },
  { to: '/checklist', icon: Plane, label: 'Checklist' },
  { to: '/perfil', icon: User, label: 'Mi Perfil' },
];

export default function Navbar() {
  return (
    <nav className="app-sidebar" style={styles.nav}>
      <div className="sidebar-logo" style={styles.logo}>
        <span style={styles.logoText}>FE</span>
        <span style={styles.logoSub}>IE '26</span>
      </div>
      <div className="sidebar-links" style={styles.links}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="sidebar-link"
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : {}),
            })}
          >
            <Icon size={16} />
            <span className="sidebar-link-label" style={styles.linkLabel}>{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-status" style={styles.status}>
        <span style={styles.dot} />
        <span style={styles.statusText}>Sistema activo</span>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    left: 0, top: 0, bottom: 0,
    width: 220,
    background: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    zIndex: 100,
  },
  logo: {
    padding: '0 20px 28px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 16,
  },
  logoText: {
    display: 'block',
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '-1px',
    lineHeight: 1,
  },
  logoSub: {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--mono)',
    letterSpacing: '2px',
    marginTop: 4,
  },
  links: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 12px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
    border: '1px solid transparent',
  },
  linkActive: {
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-glow)',
  },
  linkLabel: { fontSize: 13 },
  status: {
    padding: '16px 20px 0',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 8px var(--green)',
  },
  statusText: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
};
