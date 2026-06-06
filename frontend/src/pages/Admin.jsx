import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useConfirmStore from '../store/confirmStore';

// ── Stat Card (macOS Widget style) ─────────────────────────────
const StatCard = ({ label, value, icon, colorClass, textClass, bgClass, sub }) => (
    <div className="bg-white border border-black/5 rounded-[20px] p-5 shadow-apple-sm flex items-center gap-4 transition-all hover:shadow-apple-md hover:scale-[1.01] duration-200">
        <div className={`h-11 w-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${bgClass} ${textClass}`}>
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
            <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">{value ?? 0}</p>
            <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mt-0.5">{label}</p>
            {sub && <p className="text-[9px] text-[#86868b] mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ── Role Badge (macOS pill badge) ─────────────────────────────
const RoleBadge = ({ role }) => {
    const map = {
        STUDENT: 'bg-[#0071e3]/10 text-[#0071e3]',
        TEACHER: 'bg-[#af52de]/10 text-[#af52de]',
        RESEARCHER: 'bg-[#ff9500]/10 text-[#ff9500]',
        ADMIN: 'bg-[#ff3b30]/10 text-[#ff3b30]',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${map[role] || 'bg-[#86868b]/10 text-[#86868b]'}`}>
            {role}
        </span>
    );
};

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: 'bg-[#34c759]/10 text-[#34c759]',
        PENDING: 'bg-[#ff9500]/10 text-[#ff9500]',
        BLOCKED: 'bg-[#ff3b30]/10 text-[#ff3b30]',
        DISABLED: 'bg-gray-100 text-gray-500',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
};

export default function Admin() {
    const { showConfirm } = useConfirmStore();
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [reports, setReports] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('DASHBOARD');

    // Warning modal
    const [warnTarget, setWarnTarget] = useState(null);
    const [warnMessage, setWarnMessage] = useState('');

    // Role edit modal
    const [roleTarget, setRoleTarget] = useState(null);
    const [roleValue, setRoleValue] = useState('');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [s, p, a, po, r, act] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/pending-users'),
                api.get('/admin/users'),
                api.get('/admin/posts'),
                api.get('/admin/reports'),
                api.get('/admin/activity'),
            ]);
            setStats(s.data);
            setPendingUsers(p.data);
            setAllUsers(a.data);
            setAllPosts(po.data);
            setReports(r.data);
            setActivities(act.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ── Handlers ─────────────────────────────────────────────
    const handleApprove = async (id) => {
        await api.post(`/admin/users/${id}/approve`);
        fetchAll();
    };

    const handleReject = async (id) => {
        await api.post(`/admin/users/${id}/reject`);
        fetchAll();
    };

    const handleToggleStatus = async (id) => {
        await api.post(`/admin/users/${id}/toggle-status`);
        fetchAll();
    };

    const handleDeleteUser = async (id) => {
        showConfirm('Supprimer définitivement ce compte ?', async () => {
            await api.delete(`/admin/users/${id}`);
            fetchAll();
        });
    };

    const handleChangeRole = async () => {
        if (!roleTarget || !roleValue) return;
        await api.patch(`/admin/users/${roleTarget.id}/role`, { role: roleValue });
        setRoleTarget(null);
        fetchAll();
    };

    const handleSendWarning = async () => {
        if (!warnTarget || !warnMessage.trim()) return;
        await api.post(`/admin/users/${warnTarget.id}/warn`, { message: warnMessage });
        setWarnTarget(null);
        setWarnMessage('');
    };

    const handleDeletePost = async (id) => {
        showConfirm('Supprimer cette publication ?', async () => {
            await api.delete(`/admin/posts/${id}`);
            setAllPosts(allPosts.filter(p => p.id !== id));
            setStats(s => ({ ...s, total_posts: s.total_posts - 1 }));
        });
    };

    const handleResolveReport = async (id, status) => {
        await api.post(`/admin/reports/${id}/resolve`, { status });
        setReports(reports.map(r => r.id === id ? { ...r, status } : r));
    };

    if (loading) return <BrandLoader />;

    const TABS = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: 'analytics' },
        { id: 'PENDING', label: 'Validations', icon: 'verified_user', count: pendingUsers.length },
        { id: 'USERS', label: 'Membres', icon: 'group', count: allUsers.length },
        { id: 'POSTS', label: 'Publications', icon: 'article', count: allPosts.length },
        { id: 'REPORTS', label: 'Signalements', icon: 'flag', count: reports.filter(r => r.status === 'PENDING').length },
    ];

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
            <Navbar />

            {/* Warning Modal (macOS Style Alert Sheet) */}
            {warnTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white border border-black/5 rounded-[24px] p-6 max-w-md w-full shadow-apple-xl animate-fadeInUp">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="material-symbols-outlined text-[#ff9500] text-[24px]">notification_important</span>
                            <h3 className="font-bold text-[#1d1d1f] text-base">Envoyer un avertissement</h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3">
                            À : {warnTarget.first_name} {warnTarget.last_name}
                        </p>
                        <textarea
                          className="w-full min-h-[100px] bg-[#f5f5f7] border border-transparent focus:border-[#0071e3] focus:bg-white rounded-[12px] p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium mb-5"
                          placeholder="Rédigez le motif ou message d'avertissement..."
                          value={warnMessage}
                          onChange={e => setWarnMessage(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setWarnTarget(null); setWarnMessage(''); }} className="h-[34px] px-5 rounded-full border border-black/10 text-[#48484a] hover:bg-[#f5f5f7] text-xs font-semibold transition-all press-effect">
                                Annuler
                            </button>
                            <button onClick={handleSendWarning} className="h-[34px] px-5 rounded-full bg-[#ff9500] hover:bg-[#e08400] text-white text-xs font-semibold transition-all press-effect flex items-center gap-1 shadow-apple-xs">
                                <span className="material-symbols-outlined text-[16px]">send</span> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {roleTarget && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white border border-black/5 rounded-[24px] p-6 max-w-sm w-full shadow-apple-xl animate-fadeInUp">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="material-symbols-outlined text-[#0071e3] text-[24px]">manage_accounts</span>
                            <h3 className="font-bold text-[#1d1d1f] text-base">Modifier le rôle</h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-4">
                            Membre : {roleTarget.first_name} {roleTarget.last_name}
                        </p>
                        <div className="relative mb-5">
                            <button
                              type="button"
                              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                              className="w-full h-[38px] px-3.5 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                            >
                              <span>
                                {roleValue === 'STUDENT' && 'STUDENT'}
                                {roleValue === 'TEACHER' && 'TEACHER'}
                                {roleValue === 'RESEARCHER' && 'RESEARCHER'}
                                {roleValue === 'ADMIN' && 'ADMIN'}
                              </span>
                              <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                                  expand_more
                              </span>
                            </button>

                            {isRoleDropdownOpen && (
                              <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left">
                                      {['STUDENT', 'TEACHER', 'RESEARCHER', 'ADMIN'].map((r) => (
                                          <button
                                              key={r}
                                              type="button"
                                              onClick={() => {
                                                  setRoleValue(r);
                                                  setIsRoleDropdownOpen(false);
                                              }}
                                              className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                  roleValue === r ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                              }`}
                                          >
                                              <span>{r}</span>
                                              {roleValue === r && (
                                                  <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                              )}
                                          </button>
                                      ))}
                                  </div>
                              </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRoleTarget(null)} className="h-[34px] px-5 rounded-full border border-black/10 text-[#48484a] hover:bg-[#f5f5f7] text-xs font-semibold transition-all press-effect">
                                Annuler
                            </button>
                            <button onClick={handleChangeRole} className="h-[34px] px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-all press-effect shadow-apple-xs">
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1128px] mx-auto w-full px-4 py-8 flex-grow">
                {/* Header Console */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-[14px] bg-[#1d1d1f] flex items-center justify-center shadow-apple-xs">
                            <span className="material-symbols-outlined text-white text-[26px]">admin_panel_settings</span>
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-[#1d1d1f] tracking-tight">Console Admin</h1>
                            <p className="text-[12px] text-[#6e6e73]">Gestion administrative et modération du réseau IGA</p>
                        </div>
                    </div>
                    <button onClick={fetchAll} className="h-[34px] px-4 rounded-full bg-white border border-black/5 hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold transition-all press-effect flex items-center gap-1 shadow-apple-xs">
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Actualiser
                    </button>
                </div>

                {/* Grid Layout: Sidebar and Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left Sidebar Menu (macOS Dark SideBar Panel) */}
                    <aside className="lg:col-span-3">
                        <div className="bg-[#1d1d1f] rounded-[24px] p-4 shadow-apple-md space-y-1.5 text-white">
                            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3.5 mb-3">Sections Console</h4>
                            {TABS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-semibold transition-all text-left press-effect ${
                                        tab === t.id
                                            ? 'bg-white/10 text-white shadow-apple-xs'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                                        {t.label}
                                    </span>
                                    {t.count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                            tab === t.id ? 'bg-[#0071e3] text-white' : 'bg-white/20 text-white'
                                        }`}>{t.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Right Panel Main View */}
                    <section className="lg:col-span-9 space-y-6">

                        {/* ── DASHBOARD TAB ─────────────────────────────────── */}
                        {tab === 'DASHBOARD' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Statistics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <StatCard label="Total membres" value={stats?.total_users} icon="group" bgClass="bg-[#0071e3]/10" textClass="text-[#0071e3]" />
                                    <StatCard label="Membres actifs" value={stats?.active_users} icon="verified" bgClass="bg-[#34c759]/10" textClass="text-[#34c759]" />
                                    <StatCard label="En attente" value={stats?.pending_users} icon="hourglass_empty" bgClass="bg-[#ff9500]/10" textClass="text-[#ff9500]" />
                                    <StatCard label="Comptes Bannis" value={stats?.blocked_users} icon="person_off" bgClass="bg-[#ff3b30]/10" textClass="text-[#ff3b30]" />
                                    <StatCard label="Publications" value={stats?.total_posts} icon="chat" bgClass="bg-[#5ac8fa]/10" textClass="text-[#5ac8fa]" />
                                    <StatCard label="Projets" value={stats?.total_projects} icon="folder" bgClass="bg-[#af52de]/10" textClass="text-[#af52de]" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Role Distribution Chart Widget */}
                                    <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-apple-sm">
                                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-4">Répartition des profils</h3>
                                        <div className="space-y-3.5">
                                            {Object.entries(stats?.role_distribution || {}).map(([role, count]) => {
                                                const total = stats?.total_users || 1;
                                                const pct = Math.round((count / total) * 100);
                                                const colors = { 
                                                    STUDENT: 'bg-[#0071e3]', 
                                                    TEACHER: 'bg-[#af52de]', 
                                                    RESEARCHER: 'bg-[#ff9500]', 
                                                    ADMIN: 'bg-[#ff3b30]' 
                                                };
                                                return (
                                                    <div key={role}>
                                                        <div className="flex justify-between text-xs font-semibold text-[#48484a] mb-1 px-0.5">
                                                            <span className="uppercase tracking-wider text-[10px] text-[#86868b]">{role}</span>
                                                            <span>{count} ({pct}%)</span>
                                                        </div>
                                                        <div className="h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${colors[role] || 'bg-gray-400'} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Recent Activity Widget */}
                                    <div className="bg-white border border-black/5 rounded-[24px] p-6 shadow-apple-sm">
                                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-4 flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 bg-[#34c759] rounded-full animate-pulse inline-block" />
                                            Activité système récente
                                        </h3>
                                        <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                                            {activities.slice(0, 6).map((act, i) => (
                                                <div key={i} className="flex gap-3 items-start">
                                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-apple-xs ${act.type === 'NEW_USER' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#0071e3]/10 text-[#0071e3]'}`}>
                                                        <span className="material-symbols-outlined text-[15px]">
                                                            {act.type === 'NEW_USER' ? 'person_add' : 'chat'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-[#1d1d1f] leading-snug">{act.description}</p>
                                                        <p className="text-[9px] text-[#86868b] font-bold uppercase tracking-wider mt-0.5">
                                                            {new Date(act.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {activities.length === 0 && (
                                                <p className="text-xs text-gray-300 text-center py-6 font-bold">Aucune activité récente</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PENDING VALIDATIONS TAB ───────────────────────── */}
                        {tab === 'PENDING' && (
                            <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-black/[0.04] bg-[#ff9500]/5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ff9500] text-[20px]">verified_user</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                        Comptes académiques en attente de vérification
                                    </h2>
                                </div>
                                {pendingUsers.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-12 h-12 bg-[#34c759]/10 text-[#34c759] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-symbols-outlined text-[24px]">task_alt</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucune demande en attente</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-black/[0.04] text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="px-6 py-3.5 text-left font-bold">Utilisateur</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Rôle / Établissement</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Justificatifs</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Inscrit</th>
                                                    <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/[0.03]">
                                                {pendingUsers.map(u => (
                                                    <tr key={u.id} className="hover:bg-[#f5f5f7]/30 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-full bg-[#f5f5f7] flex items-center justify-center font-bold text-[#86868b] text-xs">
                                                                    {u.first_name?.[0]}{u.last_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[13px] text-[#1d1d1f]">{u.first_name} {u.last_name}</p>
                                                                    <p className="text-[11px] text-[#86868b]">{u.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <RoleBadge role={u.role} />
                                                            <p className="text-[11px] text-[#86868b] mt-1">{u.profile?.institution || 'IGA Casablanca'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex gap-2">
                                                                {u.profile?.diploma_url ? (
                                                                    <a 
                                                                        href={`${API_BASE}/storage/${u.profile.diploma_url}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="h-8 w-8 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white rounded-[8px] flex items-center justify-center transition-all shadow-apple-xs"
                                                                        title="Consulter Diplôme"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-[#86868b]">Aucun</span>
                                                                )}
                                                                {u.profile?.certificate_url ? (
                                                                    <a 
                                                                        href={`${API_BASE}/storage/${u.profile.certificate_url}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="h-8 w-8 bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white rounded-[8px] flex items-center justify-center transition-all shadow-apple-xs"
                                                                        title="Consulter Certificat d'Attestation"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">badge</span>
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-[#86868b] font-medium">
                                                            {new Date(u.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => handleApprove(u.id)} className="h-[26px] px-3.5 bg-[#34c759] text-white hover:bg-[#30b350] rounded-full text-[10px] font-bold uppercase tracking-wider transition-all press-effect shadow-apple-xs">
                                                                    Valider
                                                                </button>
                                                                <button onClick={() => handleReject(u.id)} className="h-[26px] px-3.5 bg-[#f5f5f7] text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all press-effect">
                                                                    Rejeter
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── ALL USERS TAB ─────────────────────────────────── */}
                        {tab === 'USERS' && (
                            <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-black/[0.04] bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#0071e3] text-[20px]">group</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                        Membres inscrits au réseau ({allUsers.length})
                                    </h2>
                                </div>
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-black/[0.04] text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                <th className="px-6 py-3.5 text-left font-bold">Membre</th>
                                                <th className="px-6 py-3.5 text-left font-bold">Rôle</th>
                                                <th className="px-6 py-3.5 text-left font-bold">Statut</th>
                                                <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/[0.03]">
                                            {allUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-[#f5f5f7]/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-[34px] w-[34px] rounded-full bg-[#f5f5f7] flex items-center justify-center font-bold text-[#86868b] text-xs flex-shrink-0">
                                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[13px] text-[#1d1d1f]">{u.first_name} {u.last_name}</p>
                                                                <p className="text-[10px] text-[#86868b]">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={u.role} /></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={u.status} /></td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {/* Toggle Status */}
                                                            <button
                                                              onClick={() => handleToggleStatus(u.id)}
                                                              title={u.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                                                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all press-effect ${u.status === 'ACTIVE' ? 'bg-[#ff9500]/10 text-[#ff9500] hover:bg-[#ff9500] hover:text-white' : 'bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white'}`}
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    {u.status === 'ACTIVE' ? 'toggle_on' : 'toggle_off'}
                                                                </span>
                                                            </button>
                                                            
                                                            {/* Change Role */}
                                                            <button
                                                              onClick={() => { setRoleTarget(u); setRoleValue(u.role); }}
                                                              title="Modifier le rôle"
                                                              className="w-7 h-7 rounded-full bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white flex items-center justify-center transition-all press-effect"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                                                            </button>

                                                            {/* Send Warning */}
                                                            <button
                                                              onClick={() => setWarnTarget(u)}
                                                              title="Avertir"
                                                              className="w-7 h-7 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white flex items-center justify-center transition-all press-effect"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                                            </button>

                                                            {/* Delete */}
                                                            {u.role !== 'ADMIN' && (
                                                                <button
                                                                  onClick={() => handleDeleteUser(u.id)}
                                                                  title="Supprimer compte"
                                                                  className="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all press-effect"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── POSTS MODERATION TAB ──────────────────────────── */}
                        {tab === 'POSTS' && (
                            <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-black/[0.04] bg-slate-50/50 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#5ac8fa] text-[20px]">article</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                        Publications partagées sur le flux ({allPosts.length})
                                    </h2>
                                </div>
                                <div className="divide-y divide-black/[0.03]">
                                    {allPosts.map(post => (
                                        <div key={post.id} className="px-6 py-5 flex items-start gap-4 hover:bg-[#f5f5f7]/30 transition-colors group">
                                            <div className="h-9 w-9 rounded-full bg-[#f5f5f7] flex items-center justify-center font-bold text-[#86868b] text-xs flex-shrink-0">
                                                {post.author?.first_name?.[0]}{post.author?.last_name?.[0]}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="font-bold text-[13px] text-[#1d1d1f]">{post.author?.first_name} {post.author?.last_name}</p>
                                                    <span className="text-[9px] font-bold bg-[#5ac8fa]/10 text-[#004fa3] px-2 py-0.2 rounded uppercase tracking-wider">{post.type}</span>
                                                    <span className="text-[10px] text-[#86868b] ml-auto font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[13px] text-[#48484a] leading-relaxed line-clamp-2">{post.content}</p>
                                                <div className="flex items-center gap-4 mt-2 text-[10px] text-[#86868b] font-bold uppercase">
                                                    <span>❤️ {post.likes_count} likes</span>
                                                    <span>💬 {post.comments_count} coms</span>
                                                </div>
                                            </div>
                                            <button
                                              onClick={() => handleDeletePost(post.id)}
                                              title="Supprimer la publication"
                                              className="w-8 h-8 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 press-effect shadow-apple-xs"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {allPosts.length === 0 && (
                                        <div className="py-20 text-center">
                                            <span className="material-symbols-outlined text-[36px] text-gray-200 block mb-2">article</span>
                                            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucune publication sur le flux</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── REPORTS TAB ───────────────────────────────────── */}
                        {tab === 'REPORTS' && (
                            <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-black/[0.04] bg-[#ff3b30]/5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ff3b30] text-[20px]">flag</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                        Modération : Contenus signalés par la communauté
                                    </h2>
                                </div>
                                {reports.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="w-12 h-12 bg-[#34c759]/10 text-[#34c759] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-symbols-outlined text-[24px]">verified</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucun signalement en attente</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-black/[0.04] text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="px-6 py-3.5 text-left font-bold">Signalé par</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Type / Cible</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Statut</th>
                                                    <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/[0.03]">
                                                {reports.map(r => (
                                                    <tr key={r.id} className="hover:bg-[#f5f5f7]/30 transition-colors group">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-[34px] w-[34px] rounded-full bg-[#ff3b30]/10 flex items-center justify-center text-[#ff3b30]">
                                                                    <span className="material-symbols-outlined text-[16px]">warning</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[13px] text-[#1d1d1f]">{r.reporter?.first_name} {r.reporter?.last_name}</p>
                                                                    <p className="text-[10px] text-[#86868b]">Motif: {r.reason}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <p className="text-xs font-bold text-[#48484a]">{r.type} #{r.reported_id}</p>
                                                            <p className="text-[9px] text-[#86868b] font-semibold mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                                r.status === 'PENDING' ? 'bg-[#ff9500]/10 text-[#ff9500]' :
                                                                r.status === 'RESOLVED' ? 'bg-[#34c759]/10 text-[#34c759]' :
                                                                'bg-gray-100 text-gray-500'
                                                            }`}>{r.status}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                                            {r.status === 'PENDING' && (
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="h-[26px] px-3 bg-[#34c759] text-white hover:bg-[#30b350] rounded-full text-[10px] font-bold uppercase tracking-wider transition-all press-effect shadow-apple-xs">
                                                                        Résoudre
                                                                    </button>
                                                                    <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="h-[26px] px-3 bg-[#f5f5f7] text-[#6e6e73] hover:bg-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all press-effect">
                                                                        Ignorer
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {r.status !== 'PENDING' && (
                                                                <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Traité</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                    </section>

                </div>
            </div>
        </div>
    );
}
