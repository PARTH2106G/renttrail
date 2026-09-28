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

const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const date = value => value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
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
    <p className="muted">Manage properties, tenants, agreements and rent cycles in one place.</p>
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

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e => e.stopPropagation()}><div className="panel-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</section></div>;
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [payments, setPayments] = useState([]);
  const [verification, setVerification] = useState(null);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [propertyForm, setPropertyForm] = useState({ address: '', unitNo: '' });
  const [tenantForm, setTenantForm] = useState({ name: '', phone: '', email: '', aadhaarRef: '' });
  const [agreementForm, setAgreementForm] = useState({ propertyId: '', tenantId: '', rentAmount: '', depositAmount: '', startDate: '', endDate: '', rentDueDay: 5 });
  const [eventForm, setEventForm] = useState({ type: 'inspection', description: '' });

  async function loadCore() {
    try {
      setError('');
      const [p, t, a] = await Promise.all([request('/properties'), request('/tenants'), request('/agreements')]);
      setProperties(p); setTenants(t); setAgreements(a);
      if (!agreementForm.propertyId && p[0]) setAgreementForm(current => ({ ...current, propertyId: p[0]._id }));
      if (!agreementForm.tenantId && t[0]) setAgreementForm(current => ({ ...current, tenantId: t[0]._id }));
    } catch (err) { setError(err.message); }
  }

  async function loadAgreementDetails(agreement) {
    setSelectedAgreement(agreement); setBusy(true); setError('');
    try {
      const [p, v, e] = await Promise.all([
        request(`/rent-payments/agreement/${agreement._id}`),
        request(`/verifications/agreement/${agreement._id}`),
        request(`/event-logs/agreement/${agreement._id}`)
      ]);
      setPayments(p); setVerification(v); setEvents(e);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  useEffect(() => { loadCore(); }, []);
  useEffect(() => { if (selectedAgreement) loadAgreementDetails(selectedAgreement); }, [selectedAgreement?._id]);

  async function submit(path, body, close = true) {
    try { setError(''); await request(path, { method: 'POST', body: JSON.stringify(body) }); if (close) setModal(null); await loadCore(); }
    catch (err) { setError(err.message); }
  }

  async function addProperty(event) { event.preventDefault(); await submit('/properties', propertyForm); setPropertyForm({ address: '', unitNo: '' }); }
  async function addTenant(event) { event.preventDefault(); await submit('/tenants', tenantForm); setTenantForm({ name: '', phone: '', email: '', aadhaarRef: '' }); }
  async function addAgreement(event) { event.preventDefault(); await submit('/agreements', { ...agreementForm, rentAmount: Number(agreementForm.rentAmount), depositAmount: Number(agreementForm.depositAmount), rentDueDay: Number(agreementForm.rentDueDay) }); setAgreementForm(current => ({ ...current, rentAmount: '', depositAmount: '', startDate: '', endDate: '' })); }

  async function createVerification() {
    if (!selectedAgreement) return;
    try { const result = await request('/verifications', { method: 'POST', body: JSON.stringify({ agreementId: selectedAgreement._id, notes: 'Verification started from dashboard' }) }); setVerification(result); }
    catch (err) { setError(err.message); }
  }
  async function updateVerification(nextStage) {
    try { setVerification(await request(`/verifications/${verification._id}/stage`, { method: 'PATCH', body: JSON.stringify({ nextStage }) })); }
    catch (err) { setError(err.message); }
  }
  async function markPaid(payment) {
    try { const updated = await request(`/rent-payments/${payment._id}/mark-paid`, { method: 'PATCH', body: JSON.stringify({}) }); setPayments(current => current.map(item => item._id === updated._id ? updated : item)); }
    catch (err) { setError(err.message); }
  }
  async function addEvent(event) { event.preventDefault(); if (!selectedAgreement) return; try { await request('/event-logs', { method: 'POST', body: JSON.stringify({ ...eventForm, agreementId: selectedAgreement._id }) }); setEventForm({ type: 'inspection', description: '' }); await loadAgreementDetails(selectedAgreement); } catch (err) { setError(err.message); } }

  const active = agreements.filter(a => a.agreementStatus === 'active').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;
  const selectedTenant = selectedAgreement?.tenantId?.name || tenants.find(t => t._id === selectedAgreement?.tenantId)?.name;

  const nav = [['overview', 'Overview'], ['properties', 'Properties'], ['tenants', 'Tenants'], ['agreements', 'Agreements']];
  return <div className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark small">RT</span><strong>RentTrail</strong></div><div className="user-menu"><span>{user?.name || user?.email}</span><button className="ghost" onClick={onLogout}>Sign out</button></div></header>
    <div className="layout"><aside className="sidebar"><p className="eyebrow">WORKSPACE</p>{nav.map(([key, label]) => <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>)}<div className="sidebar-note"><strong>Product status</strong><span>Core operations online</span></div></aside>
    <main className="content"><div className="page-heading"><div><p className="eyebrow">{tab.toUpperCase()}</p><h1>{tab === 'overview' ? `Good to see you, ${user?.name?.split(' ')[0] || 'there'}.` : nav.find(item => item[0] === tab)?.[1]}</h1><p className="muted">{tab === 'overview' ? 'Keep your rental operations moving.' : 'Manage the details that keep every tenancy on track.'}</p></div><button onClick={() => setModal(tab === 'tenants' ? 'tenant' : tab === 'agreements' ? 'agreement' : 'property')}>+ Add {tab === 'tenants' ? 'tenant' : tab === 'agreements' ? 'agreement' : 'property'}</button></div>
      {error && <div className="alert page-alert">{error}</div>}
      {tab === 'overview' && <><section className="stats"><div className="stat"><span>Properties</span><strong>{properties.length}</strong></div><div className="stat"><span>Tenants</span><strong>{tenants.length}</strong></div><div className="stat"><span>Active agreements</span><strong>{active}</strong></div><div className="stat"><span>Payments overdue</span><strong className={overdue ? 'danger-text' : 'status'}>{overdue || '0'}</strong></div></section><section className="panel"><div className="panel-heading"><div><h2>Portfolio snapshot</h2><p className="muted">Select an agreement to manage payments, verification and events.</p></div><button className="ghost" onClick={loadCore}>Refresh</button></div><AgreementTable agreements={agreements} onSelect={agreement => { setSelectedAgreement(agreement); setTab('agreements'); }} /></section></>}
      {tab === 'properties' && <section className="panel"><div className="panel-heading"><div><h2>Properties</h2><p className="muted">Your managed rental units</p></div></div><PropertyTable properties={properties} /></section>}
      {tab === 'tenants' && <section className="panel"><div className="panel-heading"><div><h2>Tenants</h2><p className="muted">Tenant contacts and verification references</p></div></div><TenantTable tenants={tenants} /></section>}
      {tab === 'agreements' && <><section className="panel"><div className="panel-heading"><div><h2>Agreements</h2><p className="muted">Contracts, rent schedules and tenant lifecycle</p></div></div><AgreementTable agreements={agreements} onSelect={loadAgreementDetails} /></section>{selectedAgreement && <AgreementWorkspace agreement={selectedAgreement} tenant={selectedTenant} payments={payments} verification={verification} events={events} busy={busy} onMarkPaid={markPaid} onCreateVerification={createVerification} onUpdateVerification={updateVerification} eventForm={eventForm} setEventForm={setEventForm} onAddEvent={addEvent} />}</>}
    </main></div>
    {modal === 'property' && <Modal title="Add property" onClose={() => setModal(null)}><form onSubmit={addProperty}><input required placeholder="Property address" value={propertyForm.address} onChange={e => setPropertyForm({ ...propertyForm, address: e.target.value })} /><input placeholder="Unit number" value={propertyForm.unitNo} onChange={e => setPropertyForm({ ...propertyForm, unitNo: e.target.value })} /><button>Add property</button></form></Modal>}
    {modal === 'tenant' && <Modal title="Add tenant" onClose={() => setModal(null)}><form onSubmit={addTenant}><input required placeholder="Full name" value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} /><input required placeholder="Phone" value={tenantForm.phone} onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })} /><input type="email" placeholder="Email" value={tenantForm.email} onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })} /><input placeholder="Masked Aadhaar reference" value={tenantForm.aadhaarRef} onChange={e => setTenantForm({ ...tenantForm, aadhaarRef: e.target.value })} /><button>Add tenant</button></form></Modal>}
    {modal === 'agreement' && <Modal title="Create agreement" onClose={() => setModal(null)}><form onSubmit={addAgreement}><select required value={agreementForm.propertyId} onChange={e => setAgreementForm({ ...agreementForm, propertyId: e.target.value })}><option value="">Select property</option>{properties.map(p => <option key={p._id} value={p._id}>{p.address} {p.unitNo ? `· ${p.unitNo}` : ''}</option>)}</select><select required value={agreementForm.tenantId} onChange={e => setAgreementForm({ ...agreementForm, tenantId: e.target.value })}><option value="">Select tenant</option>{tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select><div className="form-grid"><input required type="number" min="0" placeholder="Monthly rent" value={agreementForm.rentAmount} onChange={e => setAgreementForm({ ...agreementForm, rentAmount: e.target.value })} /><input required type="number" min="0" placeholder="Deposit" value={agreementForm.depositAmount} onChange={e => setAgreementForm({ ...agreementForm, depositAmount: e.target.value })} /></div><div className="form-grid"><label>Start date<input required type="date" value={agreementForm.startDate} onChange={e => setAgreementForm({ ...agreementForm, startDate: e.target.value })} /></label><label>End date<input required type="date" value={agreementForm.endDate} onChange={e => setAgreementForm({ ...agreementForm, endDate: e.target.value })} /></label></div><input required type="number" min="1" max="28" placeholder="Rent due day" value={agreementForm.rentDueDay} onChange={e => setAgreementForm({ ...agreementForm, rentDueDay: e.target.value })} /><button>Create agreement</button></form></Modal>}
  </div>;
}

function PropertyTable({ properties }) { return properties.length ? <div className="table-wrap"><table><thead><tr><th>Address</th><th>Unit</th><th>Status</th></tr></thead><tbody>{properties.map(p => <tr key={p._id}><td>{p.address}</td><td>{p.unitNo || '—'}</td><td><span className="pill">{p.status}</span></td></tr>)}</tbody></table></div> : <Empty text="No properties yet. Add your first property to get started." />; }
function TenantTable({ tenants }) { return tenants.length ? <div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Aadhaar ref.</th></tr></thead><tbody>{tenants.map(t => <tr key={t._id}><td>{t.name}</td><td>{t.phone}</td><td>{t.email || '—'}</td><td>{t.aadhaarRef || '—'}</td></tr>)}</tbody></table></div> : <Empty text="No tenants yet. Add a tenant before creating an agreement." />; }
function AgreementTable({ agreements, onSelect }) { return agreements.length ? <div className="table-wrap"><table><thead><tr><th>Property</th><th>Tenant</th><th>Rent</th><th>Dates</th><th>Status</th><th /></tr></thead><tbody>{agreements.map(a => <tr key={a._id}><td>{a.propertyId?.address || 'Property'}</td><td>{a.tenantId?.name || 'Tenant'}</td><td>{money(a.rentAmount)}</td><td>{date(a.startDate)} – {date(a.endDate)}</td><td><span className="pill">{a.agreementStatus}</span></td><td><button className="small-button" onClick={() => onSelect(a)}>Manage</button></td></tr>)}</tbody></table></div> : <Empty text="No agreements yet. Add a property and tenant first." />; }
function Empty({ text }) { return <div className="empty">{text}</div>; }

function AgreementWorkspace({ agreement, tenant, payments, verification, events, busy, onMarkPaid, onCreateVerification, onUpdateVerification, eventForm, setEventForm, onAddEvent }) {
  return <section className="workspace-grid"><div className="panel"><div className="panel-heading"><div><p className="eyebrow">SELECTED AGREEMENT</p><h2>{agreement.propertyId?.address || 'Agreement'}</h2><p className="muted">{tenant || 'Tenant'} · {money(agreement.rentAmount)} monthly</p></div><span className="pill">{agreement.agreementStatus}</span></div><div className="detail-grid"><div><span>Start date</span><strong>{date(agreement.startDate)}</strong></div><div><span>End date</span><strong>{date(agreement.endDate)}</strong></div><div><span>Deposit</span><strong>{money(agreement.depositAmount)}</strong></div></div></div>
    <div className="panel"><div className="panel-heading"><div><h2>Rent payments</h2><p className="muted">Auto-generated schedule</p></div></div>{payments.length ? <div className="table-wrap"><table><thead><tr><th>Due</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>{payments.map(p => <tr key={p._id}><td>{date(p.dueDate)}</td><td>{money(p.amount)}</td><td><span className={`pill ${p.status}`}>{p.status}</span></td><td>{p.status !== 'paid' && <button className="small-button" onClick={() => onMarkPaid(p)}>Mark paid</button>}</td></tr>)}</tbody></table></div> : <Empty text={busy ? 'Loading payments…' : 'No payment schedule found.'} />}</div>
    <div className="panel"><div className="panel-heading"><div><h2>Verification</h2><p className="muted">Police/document verification workflow</p></div>{verification && <span className={`pill ${verification.stage}`}>{verification.stage}</span>}</div>{!verification ? <><p className="muted">Start a verification record for this tenant.</p><button onClick={onCreateVerification}>Start verification</button></> : <div className="verification-actions"><p>Submitted {date(verification.submittedDate)}</p>{verification.stage === 'submitted' && <button onClick={() => onUpdateVerification('in_review')}>Move to review</button>}{verification.stage === 'in_review' && <div className="button-row"><button onClick={() => onUpdateVerification('cleared')}>Clear verification</button><button className="danger-button" onClick={() => onUpdateVerification('flagged')}>Flag</button></div>}{verification.stage === 'flagged' && <button onClick={() => onUpdateVerification('in_review')}>Review again</button>}{verification.stage === 'cleared' && <p className="success-text">Cleared {date(verification.clearedDate)}</p>}</div>}</div>
    <div className="panel"><div className="panel-heading"><div><h2>Event history</h2><p className="muted">Repairs, notices and inspections</p></div></div><form className="event-form" onSubmit={onAddEvent}><select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}><option value="inspection">Inspection</option><option value="repair_request">Repair request</option><option value="notice">Notice</option><option value="rent_receipt">Rent receipt</option><option value="other">Other</option></select><input required placeholder="Describe this event" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} /><button>Add event</button></form>{events.length ? <div className="timeline">{events.map(e => <div className="timeline-item" key={e._id}><span className="timeline-dot" /><div><strong>{e.type.replace('_', ' ')}</strong><p>{e.description}</p><small>{date(e.timestamp)}</small></div></div>)}</div> : <Empty text="No events recorded yet." />}</div>
  </section>;
}

function App() { const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('renttrail_user') || 'null')); if (!user) return <Auth onAuthenticated={setUser} />; return <Dashboard user={user} onLogout={() => { localStorage.clear(); setUser(null); }} />; }
createRoot(document.getElementById('root')).render(<App />);
