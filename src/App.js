import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import { SubjectList, ClassDetail } from './pages/Clases';
import Contactos from './pages/Contactos';
import Agentes from './pages/Agentes';
import Reflexiones from './pages/Reflexiones';
import MiPerfil from './pages/MiPerfil';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', background: 'var(--bg)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clases" element={<SubjectList />} />
            <Route path="/clases/:id" element={<ClassDetail />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/agentes" element={<Agentes />} />
            <Route path="/reflexiones" element={<Reflexiones />} />
            <Route path="/perfil" element={<MiPerfil />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
