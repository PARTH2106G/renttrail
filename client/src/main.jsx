import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('renttrail_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('renttrail_token', result.token);
      localStorage.setItem('renttrail_user', JSON.stringify(result.user));
      onAuthenticated(result.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card">
    <div className="brand-mark">RT</div><p className="eyebrow">PROPERTY OPERATIONS</p>
    <h1>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h1>
    <p className="muted">Track properties, agreements, verification and rent cycles in one place.</p>
    <form onSubmit={submit}>
      {mode === 'register' && <input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
      <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input required minLength="8" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      {error && <div className="alert">{error}</div>}
      <button disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <button className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
      {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
    </button>
  </section></main>;
}

function Dashboard({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [error, setError] = useState('');
  const [showProperty, setShowProperty] = useState(false);
  const [property, setProperty] = useState({ address: '', unitNo: '' });

  async function load() {
    try { setError(''); const [p, a] = await Promise.all([request('/properties'), request('/agreements')]); setProperties(p); setAgreements(a); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function addProperty(event) {
    event.preventDefault();
    try { await request('/properties', { method: 'POST', body: JSON.stringify(property) }); setProperty({ address: '', unitNo: '' }); setShowProperty(false); load(); }
    catch (err) { setError(err.message); }
  }

  const active = useMemo(() => agreements.filter(a => a.agreementStatus === 'active').length, [agreements]);
  return <div className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark small">RT</span><strong>RentTrail</strong></div><div className="user-menu"><span>{user?.name || user?.email}</span><button className="ghost" onClick={onLogout}>Sign out</button></div></header>
    <main className="content"><div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1><p className="muted">Keep your rental operations moving.</p></div><button onClick={() => setShowProperty(!showProperty)}>+ Add property</button></div>
      {error && <div className="alert">{error}</div>}
      {showProperty && <form className="panel inline-form" onSubmit={addProperty}><input required placeholder="Property address" value={property.address} onChange={e => setProperty({ ...property, address: e.target.value })} /><input placeholder="Unit number" value={property.unitNo} onChange={e => setProperty({ ...property, unitNo: e.target.value })} /><button>Add</button></form>}
      <section className="stats"><div className="stat"><span>Properties</span><strong>{properties.length}</strong></div><div className="stat"><span>Agreements</span><strong>{agreements.length}</strong></div><div className="stat"><span>Active tenants</span><strong>{active}</strong></div><div className="stat"><span>System status</span><strong className="status">● Online</strong></div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Properties</h2><p className="muted">Your managed rental units</p></div><button className="ghost" onClick={load}>Refresh</button></div>{properties.length === 0 ? <div className="empty">No properties yet. Add your first property to get started.</div> : <div className="table-wrap"><table><thead><tr><th>Address</th><th>Unit</th><th>Status</th></tr></thead><tbody>{properties.map(p => <tr key={p._id}><td>{p.address}</td><td>{p.unitNo || '—'}</td><td><span className="pill">{p.status}</span></td></tr>)}</tbody></table></div>}</section>
    </main></div>;
}

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('renttrail_user') || 'null'));
  if (!user) return <Auth onAuthenticated={setUser} />;
  return <Dashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />;
}

createRoot(document.getElementById('root')).render(<App />);
