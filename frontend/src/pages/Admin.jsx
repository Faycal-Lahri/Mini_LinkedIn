import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useConfirmStore from '../store/confirmStore';

// ── API Base URL ───────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
        STUDENT: { text: 'Étudiant', cls: 'bg-[#0071e3]/10 text-[#0071e3]' },
        TEACHER: { text: 'Enseignant', cls: 'bg-[#af52de]/10 text-[#af52de]' },
        RESEARCHER: { text: 'Chercheur', cls: 'bg-[#ff9500]/10 text-[#ff9500]' },
        ADMIN: { text: 'Admin', cls: 'bg-[#ff3b30]/10 text-[#ff3b30]' },
    };
    const item = map[role] || { text: role, cls: 'bg-[#86868b]/10 text-[#86868b]' };
    return (
        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold ${item.cls}`}>
            {item.text}
        </span>
    );
};

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ACTIVE: { text: 'Actif', cls: 'bg-[#34c759]/10 text-[#34c759]' },
        PENDING: { text: 'En attente', cls: 'bg-[#ff9500]/10 text-[#ff9500]' },
        BLOCKED: { text: 'Bloqué', cls: 'bg-[#ff3b30]/10 text-[#ff3b30]' },
        DISABLED: { text: 'Désactivé', cls: 'bg-gray-100 text-gray-500' },
    };
    const item = map[status] || { text: status, cls: 'bg-gray-100 text-gray-500' };
    return (
        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold ${item.cls}`}>
            {item.text}
        </span>
    );
};

// ── Custom Dropdown Select Component ──────────────────────────
const CustomSelect = ({ value, onChange, options, label, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div className={`relative ${className}`}>
            {label && <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[38px] px-3.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] rounded-[10px] text-[12px] font-semibold outline-none transition-all flex items-center justify-between text-[#1d1d1f] shadow-sm select-none cursor-pointer"
            >
                <span>{selectedOption?.label}</span>
                <span className="material-symbols-outlined text-[16px] text-gray-400 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#d2d2d7]/30 rounded-[12px] shadow-apple-lg py-1.5 z-[101] animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left max-h-[200px] overflow-y-auto no-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between border-none cursor-pointer bg-transparent font-semibold text-xs ${
                                    value === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {value === opt.value && (
                                    <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
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
    const [dashSubTab, setDashSubTab] = useState('OVERVIEW'); // OVERVIEW, CHARTS, TABLES, LISTS

    // Warning modal
    const [warnTarget, setWarnTarget] = useState(null);
    const [warnMessage, setWarnMessage] = useState('');

    // Role edit modal
    const [roleTarget, setRoleTarget] = useState(null);
    const [roleValue, setRoleValue] = useState('');
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

    // Member search & filter states
    const [memberSearch, setMemberSearch] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState('ALL');
    const [memberStatusFilter, setMemberStatusFilter] = useState('ALL');
    const [memberInstitutionFilter, setMemberInstitutionFilter] = useState('');

    // Member view/edit detail states
    const [selectedUser, setSelectedUser] = useState(null);
    const [editUserFirstName, setEditUserFirstName] = useState('');
    const [editUserLastName, setEditUserLastName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserRole, setEditUserRole] = useState('STUDENT');
    const [editUserStatus, setEditUserStatus] = useState('ACTIVE');
    const [editUserInstitution, setEditUserInstitution] = useState('');
    const [editUserBio, setEditUserBio] = useState('');
    const [editUserPassword, setEditUserPassword] = useState('');
    const [editUserField, setEditUserField] = useState('');
    const [editUserStudyLevel, setEditUserStudyLevel] = useState('');
    const [editUserDepartment, setEditUserDepartment] = useState('');
    const [editUserLaboratory, setEditUserLaboratory] = useState('');
    const [editUserLocation, setEditUserLocation] = useState('');
    const [editUserPhone, setEditUserPhone] = useState('');
    const [editUserLinkedinUrl, setEditUserLinkedinUrl] = useState('');
    const [editUserGithubUrl, setEditUserGithubUrl] = useState('');
    const [editUserWebsiteUrl, setEditUserWebsiteUrl] = useState('');

    // Post search & filter states
    const [postSearch, setPostSearch] = useState('');
    const [postAuthorSearch, setPostAuthorSearch] = useState('');
    const [postRoleFilter, setPostRoleFilter] = useState('ALL');
    const [isPostRoleDropdownOpen, setIsPostRoleDropdownOpen] = useState(false);
    const [postMediaFilter, setPostMediaFilter] = useState('ALL'); // ALL, IMAGE, VIDEO, PDF, TEXT
    const [selectedPostDetails, setSelectedPostDetails] = useState(null);

    // Post edit modal
    const [editPostTarget, setEditPostTarget] = useState(null);
    const [editPostTitle, setEditPostTitle] = useState('');
    const [editPostContent, setEditPostContent] = useState('');
    const [editPostType, setEditPostType] = useState('GENERAL');

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
        showConfirm('Supprimer définitivement ce compte ? Toutes les publications, commentaires, projets et messages liés seront également supprimés.', async () => {
            await api.delete(`/admin/users/${id}`);
            fetchAll();
        });
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditUserFirstName(user.first_name || '');
        setEditUserLastName(user.last_name || '');
        setEditUserEmail(user.email || '');
        setEditUserRole(user.role || 'STUDENT');
        setEditUserStatus(user.status || 'ACTIVE');
        setEditUserInstitution(user.profile?.institution || '');
        setEditUserBio(user.profile?.biography || '');
        setEditUserPassword('');
        setEditUserField(user.profile?.field || '');
        setEditUserStudyLevel(user.profile?.study_level || '');
        setEditUserDepartment(user.profile?.department || '');
        setEditUserLaboratory(user.profile?.laboratory || '');
        setEditUserLocation(user.profile?.location || '');
        setEditUserPhone(user.profile?.phone || '');
        setEditUserLinkedinUrl(user.profile?.linkedin_url || '');
        setEditUserGithubUrl(user.profile?.github_url || '');
        setEditUserWebsiteUrl(user.profile?.website_url || '');
    };

    const handleSaveUser = async () => {
        if (!editUserFirstName.trim() || !editUserLastName.trim() || !editUserEmail.trim()) {
            return;
        }
        try {
            const res = await api.put(`/admin/users/${selectedUser.id}`, {
                first_name: editUserFirstName,
                last_name: editUserLastName,
                email: editUserEmail,
                role: editUserRole,
                status: editUserStatus,
                institution: editUserInstitution,
                bio: editUserBio,
                password: editUserPassword || undefined,
                field: editUserField,
                study_level: editUserStudyLevel,
                department: editUserDepartment,
                laboratory: editUserLaboratory,
                location: editUserLocation,
                phone: editUserPhone,
                linkedin_url: editUserLinkedinUrl,
                github_url: editUserGithubUrl,
                website_url: editUserWebsiteUrl
            });
            setAllUsers(allUsers.map(u => u.id === selectedUser.id ? { ...u, ...res.data.user } : u));
            setSelectedUser(null);
            fetchAll();
        } catch (e) {
            console.error(e);
        }
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

    const handleDeleteComment = async (commentId) => {
        showConfirm('Supprimer ce commentaire définitivement ?', async () => {
            try {
                await api.delete(`/admin/comments/${commentId}`);
                setAllPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === selectedPostDetails?.id) {
                        return {
                            ...p,
                            comments_count: Math.max(0, p.comments_count - 1),
                            comments: (p.comments || []).filter(c => c.id !== commentId)
                        };
                    }
                    return p;
                }));
                setSelectedPostDetails(prevDetails => {
                    if (!prevDetails) return null;
                    return {
                        ...prevDetails,
                        comments_count: Math.max(0, prevDetails.comments_count - 1),
                        comments: (prevDetails.comments || []).filter(c => c.id !== commentId)
                    };
                });
            } catch (e) {
                console.error(e);
            }
        });
    };

    const handleEditPost = (post) => {
        setEditPostTarget(post);
        setEditPostTitle(post.title || post.article_title || '');
        setEditPostContent(post.content || '');
        setEditPostType(post.type || 'GENERAL');
    };

    const handleSavePost = async () => {
        if (!editPostTarget) return;
        try {
            const res = await api.put(`/admin/posts/${editPostTarget.id}`, {
                title: editPostTitle,
                content: editPostContent,
                type: editPostType
            });
            setAllPosts(allPosts.map(p => p.id === editPostTarget.id ? { ...p, ...res.data.post } : p));
            setEditPostTarget(null);
        } catch (e) {
            console.error(e);
        }
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

    // Filter members list
    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(memberSearch.toLowerCase());
        const matchesRole = memberRoleFilter === 'ALL' || u.role === memberRoleFilter;
        const matchesStatus = memberStatusFilter === 'ALL' || u.status === memberStatusFilter;
        const matchesInstitution = !memberInstitutionFilter || (u.profile?.institution || '').toLowerCase().includes(memberInstitutionFilter.toLowerCase());
        return matchesSearch && matchesRole && matchesStatus && matchesInstitution;
    });

    // Filter publications list
    const filteredPosts = allPosts.filter(post => {
        const authorName = `${post.author?.first_name} ${post.author?.last_name}`.toLowerCase();
        const matchesSearch = 
            !postSearch ||
            (post.title?.toLowerCase() || '').includes(postSearch.toLowerCase()) ||
            (post.article_title?.toLowerCase() || '').includes(postSearch.toLowerCase()) ||
            (post.content?.toLowerCase() || '').includes(postSearch.toLowerCase()) ||
            authorName.includes(postSearch.toLowerCase());
            
        const matchesAuthor = 
            !postAuthorSearch ||
            authorName.includes(postAuthorSearch.toLowerCase());
            
        const matchesRole = postRoleFilter === 'ALL' || post.author?.role === postRoleFilter;

        // Media filter matching
        let matchesMedia = true;
        const fileUrls = post.file_urls || (post.file_url ? [post.file_url] : []);
        const hasFiles = fileUrls.length > 0;
        
        if (postMediaFilter === 'TEXT') {
            matchesMedia = !hasFiles;
        } else if (postMediaFilter === 'IMAGE') {
            matchesMedia = post.media_type === 'IMAGE' || (hasFiles && fileUrls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i));
        } else if (postMediaFilter === 'VIDEO') {
            matchesMedia = post.media_type === 'VIDEO' || (hasFiles && fileUrls[0].match(/\.(mp4|mov|avi|mpeg)$/i));
        } else if (postMediaFilter === 'PDF') {
            matchesMedia = post.media_type === 'PDF' || (hasFiles && fileUrls[0].match(/\.pdf$/i)) || post.type === 'SCIENTIFIC_ARTICLE';
        }

        return matchesSearch && matchesAuthor && matchesRole && matchesMedia;
    });

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
            <Navbar />

            {/* Warning Modal (macOS Style Sheet) */}
            {warnTarget && (
                <div className="fixed inset-0 bg-black/15 backdrop-blur-[6px] flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-[20px] p-6 max-w-md w-full shadow-apple-lg animate-fadeInUp text-left">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="material-symbols-outlined text-[#ff9500] text-[24px]">notification_important</span>
                            <h3 className="font-bold text-[#1d1d1f] text-[16px] tracking-tight">Envoyer un avertissement</h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3">
                            À : {warnTarget.first_name} {warnTarget.last_name}
                        </p>
                        <textarea
                          className="w-full min-h-[100px] bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[12px] p-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium mb-5"
                          placeholder="Rédigez le motif ou message d'avertissement..."
                          value={warnMessage}
                          onChange={e => setWarnMessage(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setWarnTarget(null); setWarnMessage(''); }} className="h-[38px] px-5 rounded-[10px] bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1d1d1f] text-[13px] font-semibold transition-all press-effect border-none cursor-pointer">
                                Annuler
                            </button>
                            <button onClick={handleSendWarning} className="h-[38px] px-5 rounded-[10px] bg-[#ff9500] hover:bg-[#e08400] text-white text-[13px] font-semibold transition-all press-effect flex items-center gap-1.5 shadow-sm border-none cursor-pointer">
                                <span className="material-symbols-outlined text-[16px]">send</span> Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {roleTarget && (
                <div className="fixed inset-0 bg-black/15 backdrop-blur-[6px] flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-[20px] p-6 max-w-sm w-full shadow-apple-lg animate-fadeInUp text-left">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="material-symbols-outlined text-[#0071e3] text-[24px]">manage_accounts</span>
                            <h3 className="font-bold text-[#1d1d1f] text-[16px] tracking-tight">Modifier le rôle</h3>
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
                                {roleValue === 'STUDENT' && 'Étudiant'}
                                {roleValue === 'TEACHER' && 'Enseignant'}
                                {roleValue === 'RESEARCHER' && 'Chercheur'}
                                {roleValue === 'ADMIN' && 'Admin'}
                              </span>
                              <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                                  expand_more
                              </span>
                            </button>

                            {isRoleDropdownOpen && (
                              <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                                  <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left">
                                      {[
                                          { id: 'STUDENT', label: 'Étudiant' },
                                          { id: 'TEACHER', label: 'Enseignant' },
                                          { id: 'RESEARCHER', label: 'Chercheur' },
                                          { id: 'ADMIN', label: 'Admin' }
                                      ].map((r) => (
                                          <button
                                              key={r.id}
                                              type="button"
                                              onClick={() => {
                                                  setRoleValue(r.id);
                                                  setIsRoleDropdownOpen(false);
                                              }}
                                              className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                  roleValue === r.id ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                              }`}
                                          >
                                              <span>{r.label}</span>
                                              {roleValue === r.id && (
                                                  <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                              )}
                                          </button>
                                      ))}
                                  </div>
                              </>
                            )}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRoleTarget(null)} className="h-[38px] px-5 rounded-[10px] bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1d1d1f] text-[13px] font-semibold transition-all press-effect border-none cursor-pointer">
                                Annuler
                            </button>
                            <button onClick={handleChangeRole} className="h-[38px] px-5 rounded-[10px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold transition-all press-effect shadow-sm border-none cursor-pointer">
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Post Modal */}
            {editPostTarget && (
                <div className="fixed inset-0 bg-black/15 backdrop-blur-[6px] flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white border border-black/5 rounded-[20px] p-6 max-w-lg w-full shadow-apple-lg animate-fadeInUp text-left">
                        <div className="flex items-center gap-2.5 mb-4">
                            <span className="material-symbols-outlined text-[#0071e3] text-[24px]">edit_note</span>
                            <h3 className="font-bold text-[#1d1d1f] text-[16px] tracking-tight">Modifier la publication</h3>
                        </div>
                        <p className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-3">
                            Auteur : {editPostTarget.author?.first_name} {editPostTarget.author?.last_name}
                        </p>
                        
                        <div className="space-y-4 mb-5">
                            {/* Title */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Titre (Optionnel)</label>
                                <input
                                    type="text"
                                    className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs outline-none transition-all font-semibold"
                                    value={editPostTitle}
                                    onChange={e => setEditPostTitle(e.target.value)}
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-1.5 text-left">
                                <CustomSelect
                                    label="Catégorie / Type"
                                    value={editPostType}
                                    onChange={setEditPostType}
                                    options={[
                                        { value: 'GENERAL', label: 'Général' },
                                        { value: 'UNIVERSITY_PROJECT', label: 'Projet Académique' },
                                        { value: 'SCIENTIFIC_ARTICLE', label: 'Article Scientifique' }
                                    ]}
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-1.5 text-left">
                                <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Texte de la publication</label>
                                <textarea
                                    className="w-full min-h-[120px] bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[12px] p-3 text-xs focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all resize-none font-medium"
                                    value={editPostContent}
                                    onChange={e => setEditPostContent(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditPostTarget(null)} className="h-[38px] px-5 rounded-[10px] bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1d1d1f] text-[13px] font-semibold transition-all press-effect border-none cursor-pointer">
                                Annuler
                            </button>
                            <button onClick={handleSavePost} className="h-[38px] px-5 rounded-[10px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold transition-all press-effect shadow-sm border-none cursor-pointer">
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Details (Comments & Reactions) Modal */}
            {selectedPostDetails && (
                <div className="fixed inset-0 bg-black/15 backdrop-blur-[6px] flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white/95 backdrop-blur-md border border-black/5 rounded-[22px] p-6 max-w-2xl w-full shadow-apple-lg animate-fadeInUp flex flex-col max-h-[85vh] text-left">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#d2d2d7]/30 mb-4 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#0071e3] text-[24px]">forum</span>
                                <div>
                                    <h3 className="font-bold text-[#1d1d1f] text-[16px] tracking-tight">Détails de la publication</h3>
                                    <p className="text-[10px] text-[#86868b] font-medium mt-0.5">
                                        Par {selectedPostDetails.author?.first_name} {selectedPostDetails.author?.last_name} • {new Date(selectedPostDetails.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedPostDetails(null)} 
                                className="w-8 h-8 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 flex items-center justify-center transition-all border-none cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px] text-[#48484a]">close</span>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-grow overflow-y-auto pr-1 no-scrollbar space-y-6">
                            {/* Post content preview */}
                            <div className="bg-[#f5f5f7]/50 border border-black/5 rounded-[14px] p-4">
                                {selectedPostDetails.title && (
                                    <h4 className="font-bold text-sm text-[#1d1d1f] mb-1.5">{selectedPostDetails.title}</h4>
                                )}
                                <p className="text-xs text-[#48484a] leading-relaxed font-medium">
                                    {selectedPostDetails.content}
                                </p>
                            </div>

                            {/* Two-column Layout: Reactions & Comments */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                {/* Left column: Reactions (5 cols) */}
                                <div className="md:col-span-5 space-y-3">
                                    <h5 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                                        Réactions ({selectedPostDetails.likes?.length ?? 0})
                                    </h5>
                                    
                                    <div className="bg-[#f5f5f7]/30 border border-[#d2d2d7]/30 rounded-[14px] p-3 max-h-[300px] overflow-y-auto no-scrollbar space-y-2.5">
                                        {selectedPostDetails.likes && selectedPostDetails.likes.length > 0 ? (
                                            selectedPostDetails.likes.map((like) => {
                                                const reactionEmojis = {
                                                    LIKE: '👍',
                                                    LOVE: '❤️',
                                                    CLAP: '👏',
                                                    INSIGHTFUL: '💡',
                                                    DISLIKE: '👎'
                                                };
                                                return (
                                                    <div key={like.id} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="h-6 w-6 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]/50 flex items-center justify-center font-bold text-[#86868b] text-[9px] flex-shrink-0 overflow-hidden">
                                                                {like.user?.profile?.photo_url ? (
                                                                    <img src={`${API_BASE}/storage/${like.user.profile.photo_url}`} className="w-full h-full object-cover" alt="" />
                                                                ) : (
                                                                    <span>{like.user?.first_name?.[0]}{like.user?.last_name?.[0]}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-[#1d1d1f] truncate leading-tight">
                                                                {like.user?.first_name} {like.user?.last_name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[15px]" title={like.type}>
                                                            {reactionEmojis[like.type] || '👍'}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-[11px] text-gray-400 text-center py-6 font-semibold">Aucune réaction</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right column: Comments (7 cols) */}
                                <div className="md:col-span-7 space-y-3">
                                    <h5 className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                                        Commentaires ({selectedPostDetails.comments?.length ?? 0})
                                    </h5>
                                    
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                                        {selectedPostDetails.comments && selectedPostDetails.comments.length > 0 ? (
                                            selectedPostDetails.comments.map((comment) => (
                                                <div key={comment.id} className="bg-[#f5f5f7]/30 border border-[#d2d2d7]/30 rounded-[14px] p-3 flex gap-3 text-left">
                                                    {/* Commenter Avatar */}
                                                    <div className="h-7 w-7 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]/50 flex items-center justify-center font-bold text-[#86868b] text-[10px] flex-shrink-0 overflow-hidden">
                                                        {comment.author?.profile?.photo_url ? (
                                                            <img src={`${API_BASE}/storage/${comment.author.profile.photo_url}`} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <span>{comment.author?.first_name?.[0]}{comment.author?.last_name?.[0]}</span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Comment Content */}
                                                    <div className="min-w-0 flex-grow">
                                                        <div className="flex justify-between items-start gap-1">
                                                            <div>
                                                                <span className="text-xs font-bold text-[#1d1d1f]">
                                                                    {comment.author?.first_name} {comment.author?.last_name}
                                                                </span>
                                                                <span className="text-[9px] text-[#86868b] font-medium ml-2">
                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                title="Supprimer ce commentaire"
                                                                className="h-6 w-6 rounded-[6px] bg-[#ff3b30]/10 hover:bg-[#ff3b30] hover:text-white text-[#ff3b30] flex items-center justify-center transition-all border-none cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-[#48484a] mt-1 font-medium leading-relaxed whitespace-pre-wrap">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-[#f5f5f7]/30 border border-[#d2d2d7]/30 rounded-[14px] py-10 text-center text-gray-400">
                                                <p className="text-[11px] font-semibold">Aucun commentaire</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Member Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/15 backdrop-blur-[6px] flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white/95 backdrop-blur-md border border-black/5 rounded-[22px] p-6 max-w-xl w-full shadow-apple-lg animate-fadeInUp flex flex-col max-h-[90vh] text-left">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#d2d2d7]/30 mb-4 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#0071e3] text-[24px]">person</span>
                                <div>
                                    <h3 className="font-bold text-[#1d1d1f] text-[16px] tracking-tight">Fiche Membre & Édition</h3>
                                    <p className="text-[10px] text-[#86868b] font-medium mt-0.5">
                                        Inscrit le {new Date(selectedUser.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedUser(null)} 
                                className="w-8 h-8 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 flex items-center justify-center transition-all border-none cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px] text-[#48484a]">close</span>
                            </button>
                        </div>

                        {/* Scrollable Form */}
                        <div className="flex-grow overflow-y-auto pr-1 no-scrollbar space-y-5">
                            {/* Visual Profile Avatar & Justificatifs */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-[#f5f5f7]/50 rounded-[14px] border border-black/5 justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]/50 flex items-center justify-center font-bold text-[#86868b] text-sm overflow-hidden flex-shrink-0">
                                        {selectedUser.profile?.photo_url ? (
                                            <img src={`${API_BASE}/storage/${selectedUser.profile.photo_url}`} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span>{selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-[#1d1d1f]">{selectedUser.first_name} {selectedUser.last_name}</p>
                                        <p className="text-[11px] text-[#86868b] font-medium">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {selectedUser.profile?.diploma_url && (
                                        <a 
                                            href={`${API_BASE}/storage/${selectedUser.profile.diploma_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="h-8 px-3 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white rounded-[8px] flex items-center gap-1.5 transition-all text-xs font-semibold shadow-sm decoration-none"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span> Diplôme
                                        </a>
                                    )}
                                    {selectedUser.profile?.certificate_url && (
                                        <a 
                                            href={`${API_BASE}/storage/${selectedUser.profile.certificate_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="h-8 px-3 bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white rounded-[8px] flex items-center gap-1.5 transition-all text-xs font-semibold shadow-sm decoration-none"
                                        >
                                            <span className="material-symbols-outlined text-[15px]">badge</span> Certificat
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Editing Inputs Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* First Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Prénom</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserFirstName}
                                        onChange={(e) => setEditUserFirstName(e.target.value)}
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Nom</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserLastName}
                                        onChange={(e) => setEditUserLastName(e.target.value)}
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserEmail}
                                        onChange={(e) => setEditUserEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password (optional) */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Mot de passe (Nouveau)</label>
                                    <input 
                                        type="password" 
                                        placeholder="Laisser vide pour ne pas modifier"
                                        className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserPassword}
                                        onChange={(e) => setEditUserPassword(e.target.value)}
                                    />
                                </div>

                                {/* Institution */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Institution / Établissement</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserInstitution}
                                        onChange={(e) => setEditUserInstitution(e.target.value)}
                                    />
                                </div>

                                {/* Role Selection */}
                                <CustomSelect
                                    label="Rôle"
                                    value={editUserRole}
                                    onChange={setEditUserRole}
                                    options={[
                                        { value: 'STUDENT', label: 'Étudiant' },
                                        { value: 'TEACHER', label: 'Enseignant' },
                                        { value: 'RESEARCHER', label: 'Chercheur' },
                                        { value: 'ADMIN', label: 'Admin' }
                                    ]}
                                />

                                {/* Status Selection */}
                                <CustomSelect
                                    className="sm:col-span-2"
                                    label="Statut"
                                    value={editUserStatus}
                                    onChange={setEditUserStatus}
                                    options={[
                                        { value: 'ACTIVE', label: 'Actif (Accès autorisé)' },
                                        { value: 'PENDING', label: 'En attente (Vérification en cours)' },
                                        { value: 'BLOCKED', label: 'Bloqué (Compte suspendu)' },
                                        { value: 'DISABLED', label: 'Désactivé' }
                                    ]}
                                />
                            </div>

                            {/* Section: Academic Details */}
                            <div className="border-t border-[#d2d2d7]/30 pt-4 mt-2 text-left">
                                <h4 className="text-[12px] font-bold text-[#1d1d1f] mb-3">Informations Académiques</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Filière / Domaine */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Filière / Domaine</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserField}
                                            onChange={(e) => setEditUserField(e.target.value)}
                                        />
                                    </div>
                                    {/* Niveau d'études */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Niveau d'études</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserStudyLevel}
                                            onChange={(e) => setEditUserStudyLevel(e.target.value)}
                                        />
                                    </div>
                                    {/* Département */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Département</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserDepartment}
                                            onChange={(e) => setEditUserDepartment(e.target.value)}
                                        />
                                    </div>
                                    {/* Laboratoire */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Laboratoire</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserLaboratory}
                                            onChange={(e) => setEditUserLaboratory(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Contact & Socials */}
                            <div className="border-t border-[#d2d2d7]/30 pt-4 text-left">
                                <h4 className="text-[12px] font-bold text-[#1d1d1f] mb-3">Contact & Réseaux Sociaux</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Localisation */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Localisation / Ville</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserLocation}
                                            onChange={(e) => setEditUserLocation(e.target.value)}
                                        />
                                    </div>
                                    {/* Téléphone */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Téléphone</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserPhone}
                                            onChange={(e) => setEditUserPhone(e.target.value)}
                                        />
                                    </div>
                                    {/* LinkedIn URL */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Lien LinkedIn</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://linkedin.com/in/..."
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserLinkedinUrl}
                                            onChange={(e) => setEditUserLinkedinUrl(e.target.value)}
                                        />
                                    </div>
                                    {/* GitHub URL */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Lien GitHub</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://github.com/..."
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserGithubUrl}
                                            onChange={(e) => setEditUserGithubUrl(e.target.value)}
                                        />
                                    </div>
                                    {/* Site Web URL */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Site Web / Portfolio</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://example.com"
                                            className="w-full h-[38px] px-3 bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[10px] text-xs font-semibold outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12"
                                            value={editUserWebsiteUrl}
                                            onChange={(e) => setEditUserWebsiteUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Biography */}
                            <div className="border-t border-[#d2d2d7]/30 pt-4 text-left">
                                <h4 className="text-[12px] font-bold text-[#1d1d1f] mb-3">Biographie</h4>
                                <div className="space-y-1.5">
                                    <textarea 
                                        className="w-full min-h-[90px] bg-[#f5f5f7] border border-[#d2d2d7]/50 focus:border-[#0071e3] focus:bg-white rounded-[12px] p-3 text-xs focus:outline-none transition-all resize-none font-medium focus:ring-4 focus:ring-[#0071e3]/12"
                                        value={editUserBio}
                                        onChange={(e) => setEditUserBio(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-[#d2d2d7]/30 mt-4 flex-shrink-0">
                            <button 
                                onClick={() => setSelectedUser(null)} 
                                className="h-[38px] px-5 rounded-[10px] bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1d1d1f] text-[13px] font-semibold transition-all press-effect border-none cursor-pointer"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSaveUser} 
                                className="h-[38px] px-5 rounded-[10px] bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-semibold transition-all press-effect shadow-sm border-none cursor-pointer"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-full w-full px-8 md:px-12 py-8 flex-grow">
                {/* Header Console */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-[14px] bg-[#0071e3] flex items-center justify-center shadow-apple-sm text-white">
                            <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-[26px] font-bold text-[#1d1d1f] tracking-tight">Console Admin</h1>
                            <p className="text-[12px] text-[#6e6e73]">Gestion administrative et modération du réseau IGA</p>
                        </div>
                    </div>
                    <button onClick={fetchAll} className="h-[36px] px-4 rounded-[10px] bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1d1d1f] text-[13px] font-semibold transition-all press-effect flex items-center gap-1.5 border-none cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">refresh</span> Actualiser
                    </button>
                </div>

                {/* Grid Layout: Sidebar and Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Sidebar Menu (macOS System Settings sidebar layout) */}
                    <aside className="lg:col-span-2">
                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-3 shadow-apple-sm space-y-1 text-[#1d1d1f]">
                            <h4 className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider px-3 mb-2 text-left">Sections</h4>
                            {TABS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all text-left cursor-pointer border-none ${
                                        tab === t.id
                                            ? 'bg-[#0071e3] text-white shadow-sm font-semibold'
                                            : 'text-[#1d1d1f] hover:bg-[#767680]/8 bg-transparent'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-[18px] text-inherit">{t.icon}</span>
                                        {t.label}
                                    </span>
                                    {t.count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            tab === t.id ? 'bg-white text-[#0071e3]' : 'bg-gray-100 text-[#1d1d1f]'
                                        }`}>
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Right Panel Container */}
                    <section className="lg:col-span-10">
                        {tab === 'DASHBOARD' && (
                            <div className="space-y-12 animate-fadeIn text-left">
                                {/* Title / Intro */}
                                <div className="p-6 bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm text-left">
                                    <h3 className="font-bold text-[18px] text-[#1d1d1f] mb-2">Tableau de Bord Cockpit Analytique</h3>
                                    <p className="text-xs text-[#6e6e73] leading-relaxed">
                                        Ce tableau de bord de type Power BI regroupe de manière globale l'ensemble des données comportementales, académiques et de communication de la plateforme IGA. Les informations sont structurées en 4 sections continues : Synthèse globale, Rapports graphiques, Journaux et Listes d'activité, et enfin les Grilles de données tabulaires.
                                    </p>
                                </div>

                                {/* SECTION 1: SYNTHÈSE & KPIs */}
                                <div className="space-y-6">
                                    <div className="border-b border-[#d2d2d7]/30 pb-3">
                                        <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[24px] text-[#0071e3]">analytics</span>
                                            1. Synthèse globale & Indicateurs clés (KPIs)
                                        </h2>
                                        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mt-1">
                                            Indicateurs clés et widgets de synthèse statistique globale du réseau Scholar Network.
                                        </p>
                                    </div>

                                    {/* Statistics Grid (12 Widget Cards) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <StatCard label="Total membres" value={stats?.total_users} icon="group" bgClass="bg-[#0071e3]/10" textClass="text-[#0071e3]" sub="Nombre total de comptes créés." />
                                        <StatCard label="Membres actifs" value={stats?.active_users} icon="verified" bgClass="bg-[#34c759]/10" textClass="text-[#34c759]" sub="Comptes validés et actifs." />
                                        <StatCard label="En attente" value={stats?.pending_users} icon="hourglass_empty" bgClass="bg-[#ff9500]/10" textClass="text-[#ff9500]" sub="Comptes en attente de vérification." />
                                        <StatCard label="Comptes Bannis" value={stats?.blocked_users} icon="person_off" bgClass="bg-[#ff3b30]/10" textClass="text-[#ff3b30]" sub="Comptes bloqués pour infraction." />
                                        
                                        <StatCard label="Publications" value={stats?.total_posts} icon="chat" bgClass="bg-[#5ac8fa]/10" textClass="text-[#5ac8fa]" sub="Publications partagées." />
                                        <StatCard label="Projets" value={stats?.total_projects} icon="folder" bgClass="bg-[#af52de]/10" textClass="text-[#af52de]" sub="Projets académiques créés." />
                                        <StatCard label="Interactions Likes" value={stats?.total_likes} icon="thumb_up" bgClass="bg-[#ff2d55]/10" textClass="text-[#ff2d55]" sub="Total des réactions emojis." />
                                        <StatCard label="Commentaires" value={stats?.total_comments} icon="forum" bgClass="bg-[#00c7be]/10" textClass="text-[#00c7be]" sub="Commentaires saisis." />
                                        
                                        <StatCard label="Messages Tchat" value={stats?.total_messages} icon="question_answer" bgClass="bg-[#0071e3]/10" textClass="text-[#0071e3]" sub="Messages de discussion échangés." />
                                        <StatCard label="Interconnexions" value={stats?.total_connections} icon="hub" bgClass="bg-[#34c759]/10" textClass="text-[#34c759]" sub="Connexions établies entre membres." />
                                        <StatCard label="Canaux de Tchat" value={stats?.total_channels} icon="tag" bgClass="bg-[#ff9500]/10" textClass="text-[#ff9500]" sub="Salons de tchat actifs." />
                                        <StatCard label="Signalements" value={stats?.pending_reports} icon="flag" bgClass="bg-[#ff3b30]/10" textClass="text-[#ff3b30]" sub="Rapports de modération en attente." />
                                    </div>

                                    {/* KPI Section */}
                                    <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm text-left">
                                        <h3 className="text-[15px] font-bold text-[#1d1d1f] mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#0071e3] text-[20px]">insights</span>
                                            Indicateurs de Performance & Engagement
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <div className="p-4 rounded-[14px] bg-[#f5f5f7]/60 border border-black/5 flex flex-col justify-between hover:bg-[#f5f5f7] transition-colors duration-200">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Taux d'Activité</p>
                                                    <p className="text-3xl font-extrabold text-[#34c759] tracking-tight mt-1">
                                                        {stats?.total_users ? Math.round((stats?.active_users / stats?.total_users) * 100) : 0}%
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-[#86868b] mt-3">Proportion des membres validés et actifs sur la plateforme par rapport au total des inscrits.</p>
                                            </div>

                                            <div className="p-4 rounded-[14px] bg-[#f5f5f7]/60 border border-black/5 flex flex-col justify-between hover:bg-[#f5f5f7] transition-colors duration-200">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Moyenne d'Engagement</p>
                                                    <p className="text-3xl font-extrabold text-[#0071e3] tracking-tight mt-1 flex items-baseline gap-1.5">
                                                        {stats?.total_posts ? ((stats?.total_likes + stats?.total_comments) / stats?.total_posts).toFixed(1) : '0.0'}
                                                        <span className="text-[11px] font-bold text-[#86868b] uppercase font-sans">interactions/post</span>
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-[#86868b] mt-3">Nombre moyen de mentions j'aime et de commentaires enregistrés par publication.</p>
                                            </div>

                                            <div className="p-4 rounded-[14px] bg-[#f5f5f7]/60 border border-black/5 flex flex-col justify-between hover:bg-[#f5f5f7] transition-colors duration-200">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Contenus Signalés</p>
                                                    <p className={`text-3xl font-extrabold tracking-tight mt-1 ${stats?.pending_reports > 0 ? 'text-[#ff3b30]' : 'text-[#34c759]'}`}>
                                                        {stats?.pending_reports ?? 0}
                                                        <span className="text-[11px] font-bold text-[#86868b] uppercase ml-1.5 font-sans">en attente</span>
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-[#86868b] mt-3">Signalements de publications ou de commentaires en attente de modération par l'administrateur.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: GRAPHIQUES */}
                                <div className="space-y-6 border-t border-[#d2d2d7]/30 pt-8">
                                    <div className="border-b border-[#d2d2d7]/30 pb-3">
                                        <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[24px] text-[#34c759]">bar_chart</span>
                                            2. Graphiques d'Engagement et Tendances (10 Visualisations)
                                        </h2>
                                        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mt-1">
                                            Visualisations graphiques interactives représentant l'activité et l'engagement chronologique.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Chart 1: Inscriptions Mensuelles */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">1. Inscriptions Mensuelles</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Nouveaux comptes créés (6 derniers mois)</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique illustre le volume mensuel de nouveaux profils enregistrés sur le réseau Scholar Network, ce qui permet de mesurer l'évolution de l'attractivité et de la croissance globale de la communauté au fil des mois.</p>
                                            </div>
                                            <div className="flex items-end justify-between h-[100px] px-2 border-b border-[#d2d2d7]/40 gap-2">
                                                {stats?.signups_trend && stats.signups_trend.length > 0 ? (
                                                    stats.signups_trend.map((s, i) => {
                                                        const maxCount = Math.max(...stats.signups_trend.map(item => item.count)) || 1;
                                                        const heightPct = Math.max(10, (s.count / maxCount) * 100);
                                                        return (
                                                            <div key={i} className="flex flex-col items-center flex-grow group">
                                                                <div className="text-[10px] font-bold text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                                    {s.count}
                                                                </div>
                                                                <div 
                                                                    style={{ height: `${heightPct}%` }} 
                                                                    className="w-full max-w-[28px] bg-[#0071e3]/80 hover:bg-[#0071e3] rounded-t-[4px] transition-all duration-300"
                                                                />
                                                                <span className="text-[9px] font-semibold text-[#86868b] mt-2 select-none truncate w-full text-center">
                                                                    {s.month}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-6 w-full font-bold">Aucune donnée</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chart 2: Répartition des Rôles */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">2. Répartition des Rôles</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Proportion de membres par rôle</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique en barres horizontales présente la répartition des utilisateurs inscrits selon leurs rôles académiques respectifs (étudiants, enseignants, chercheurs, ou administrateurs), reflétant la composition structurelle du réseau.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(stats?.role_distribution || {}).map(([role, count]) => {
                                                    const total = Object.values(stats?.role_distribution || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const roleLabels = { STUDENT: 'Étudiants', TEACHER: 'Enseignants', RESEARCHER: 'Chercheurs', ADMIN: 'Admins' };
                                                    const roleColors = { STUDENT: 'bg-[#0071e3]', TEACHER: 'bg-[#af52de]', RESEARCHER: 'bg-[#ff9500]', ADMIN: 'bg-[#ff3b30]' };
                                                    return (
                                                        <div key={role} className="space-y-1">
                                                            <div className="flex justify-between text-[11px] font-bold text-[#1d1d1f]">
                                                                <span>{roleLabels[role] || role}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className={`h-full ${roleColors[role] || 'bg-gray-400'} rounded-full`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 3: Catégories Publications */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">3. Types de Publications</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Publications par catégorie de contenu</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique compare les contributions selon leur nature éditoriale. Il permet de connaître la répartition entre les projets universitaires collaboratifs, les articles de recherche scientifique, et les publications d'intérêt général.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(stats?.posts_by_type || {}).map(([type, count]) => {
                                                    const total = Object.values(stats?.posts_by_type || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const typeLabels = { GENERAL: 'Général', UNIVERSITY_PROJECT: 'Projet Académique', SCIENTIFIC_ARTICLE: 'Article Scientifique' };
                                                    return (
                                                        <div key={type} className="space-y-1">
                                                            <div className="flex justify-between text-[11px] font-bold text-[#1d1d1f]">
                                                                <span className="truncate max-w-[180px]">{typeLabels[type] || type}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#0071e3] rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 4: Modération des Signalements */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">4. Modération des Signalements</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Statut de traitement des rapports</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Affiche la proportion de signalements effectués par la communauté ayant été résolus avec succès, ignorés (rejetés), ou en cours de vérification par l'équipe d'administration du réseau.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(stats?.reports_moderation_ratio || {}).map(([status, count]) => {
                                                    const total = Object.values(stats?.reports_moderation_ratio || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const statusLabels = { PENDING: 'En attente', RESOLVED: 'Résolus', DISMISSED: 'Ignorés' };
                                                    const statusColors = { PENDING: 'bg-[#ff9500]', RESOLVED: 'bg-[#34c759]', DISMISSED: 'bg-[#86868b]' };
                                                    return (
                                                        <div key={status} className="space-y-1">
                                                            <div className="flex justify-between text-[11px] font-bold text-[#1d1d1f]">
                                                                <span>{statusLabels[status] || status}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className={`h-full ${statusColors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 5: Activité Hebdomadaire */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">5. Activité Hebdomadaire</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Publications par jour de la semaine</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique en colonnes répertorie le nombre de publications créées chaque jour de la semaine courante (du lundi au dimanche) afin d'identifier les jours de forte interaction de la communauté.</p>
                                            </div>
                                            <div className="flex items-end justify-between h-[100px] px-2 border-b border-[#d2d2d7]/40 gap-2">
                                                {stats?.weekly_posts_activity && stats.weekly_posts_activity.length > 0 ? (
                                                    stats.weekly_posts_activity.map((w, i) => {
                                                        const maxCount = Math.max(...stats.weekly_posts_activity.map(item => item.count)) || 1;
                                                        const heightPct = Math.max(10, (w.count / maxCount) * 100);
                                                        return (
                                                            <div key={i} className="flex flex-col items-center flex-grow group">
                                                                <div className="text-[9px] font-bold text-[#34c759] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                                    {w.count}
                                                                </div>
                                                                <div 
                                                                    style={{ height: `${heightPct}%` }} 
                                                                    className="w-full max-w-[18px] bg-[#34c759]/80 hover:bg-[#34c759] rounded-t-[4px] transition-all duration-300"
                                                                />
                                                                <span className="text-[9px] font-bold text-[#86868b] mt-2 select-none">
                                                                    {w.day}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-6 w-full font-bold">Aucune donnée</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chart 6: Projets par Statut */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">6. Statut des Projets</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Avancement des projets collaboratifs</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique montre l'état des espaces projets créés par les membres. Il distingue les projets ouverts aux nouveaux membres, ceux fermés aux nouvelles inscriptions, et ceux déclarés complétés ou archivés.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(stats?.projects_status_breakdown || {}).map(([status, count]) => {
                                                    const total = Object.values(stats?.projects_status_breakdown || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const statusLabels = { OPEN: 'Ouvert', CLOSED: 'Fermé', COMPLETED: 'Complété' };
                                                    const statusColors = { OPEN: 'bg-[#34c759]', CLOSED: 'bg-[#ff3b30]', COMPLETED: 'bg-[#0071e3]' };
                                                    return (
                                                        <div key={status} className="space-y-1">
                                                            <div className="flex justify-between text-[11px] font-bold text-[#1d1d1f]">
                                                                <span>{statusLabels[status] || status}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className={`h-full ${statusColors[status]} rounded-full`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 7: Emojis Réactions */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">7. Réactions Emojis</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Types de réactions sur les publications</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Présente l'analyse de sentiment des interactions en montrant la distribution des émojis de réaction laissés par les utilisateurs sous les différents posts de la plateforme.</p>
                                            </div>
                                            <div className="space-y-2">
                                                {Object.entries(stats?.reactions_breakdown || {}).map(([type, count]) => {
                                                    const total = Object.values(stats?.reactions_breakdown || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const reactionEmojis = { LIKE: '👍 J\'aime', LOVE: '❤️ J\'adore', CLAP: '👏 Bravo', INSIGHTFUL: '💡 Intéressant', DISLIKE: '👎 Inapproprié' };
                                                    return (
                                                        <div key={type} className="space-y-1">
                                                            <div className="flex justify-between text-[10px] font-bold text-[#1d1d1f]">
                                                                <span>{reactionEmojis[type] || type}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#ff2d55] rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 8: Types de Médias */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">8. Types de Médias</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Fichiers et types de contenus partagés</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique quantifie et catégorise le format des pièces jointes associées aux publications partagées sur le réseau, isolant le texte brut, les images, les vidéos et les documents PDF.</p>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(stats?.shared_media_breakdown || {}).map(([media, count]) => {
                                                    const total = Object.values(stats?.shared_media_breakdown || {}).reduce((a, b) => a + b, 0) || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    const mediaLabels = { TEXT: 'Texte uniquement', IMAGE: 'Images / Graphiques', VIDEO: 'Vidéos', PDF: 'Fichiers PDF' };
                                                    const mediaColors = { TEXT: 'bg-gray-400', IMAGE: 'bg-[#00c7be]', VIDEO: 'bg-[#af52de]', PDF: 'bg-[#ff3b30]' };
                                                    return (
                                                        <div key={media} className="space-y-1">
                                                            <div className="flex justify-between text-[11px] font-bold text-[#1d1d1f]">
                                                                <span>{mediaLabels[media] || media}</span>
                                                                <span>{count} ({pct}%)</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-[#f5f5f7] rounded-full overflow-hidden">
                                                                <div className={`h-full ${mediaColors[media] || 'bg-gray-400'} rounded-full`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Chart 9: Tendance Messages */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">9. Activité Messagerie</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Messages envoyés en tchat (6 derniers mois)</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique suit la tendance mensuelle des discussions instantanées initiées par les membres, permettant de suivre l'importance de la messagerie dans la communication interne du réseau.</p>
                                            </div>
                                            <div className="flex items-end justify-between h-[100px] px-2 border-b border-[#d2d2d7]/40 gap-2">
                                                {stats?.monthly_messages_trend && stats.monthly_messages_trend.length > 0 ? (
                                                    stats.monthly_messages_trend.map((s, i) => {
                                                        const maxCount = Math.max(...stats.monthly_messages_trend.map(item => item.count)) || 1;
                                                        const heightPct = Math.max(10, (s.count / maxCount) * 100);
                                                        return (
                                                            <div key={i} className="flex flex-col items-center flex-grow group">
                                                                <div className="text-[10px] font-bold text-[#af52de] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                                    {s.count}
                                                                </div>
                                                                <div 
                                                                    style={{ height: `${heightPct}%` }} 
                                                                    className="w-full max-w-[28px] bg-[#af52de]/80 hover:bg-[#af52de] rounded-t-[4px] transition-all duration-300"
                                                                />
                                                                <span className="text-[9px] font-semibold text-[#86868b] mt-2 select-none truncate w-full text-center">
                                                                    {s.month}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-6 w-full font-bold">Aucune donnée</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chart 10: Tendance Publications */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm flex flex-col justify-between min-h-[260px] text-left">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1">10. Tendance des Publications</h4>
                                                <p className="text-[10px] text-[#86868b] font-medium mb-2">Total de publications (6 derniers mois)</p>
                                                <p className="text-[11px] text-[#6e6e73] mb-4">Ce graphique présente l'évolution du volume total de publications postées par les utilisateurs au cours des 6 derniers mois, illustrant le dynamisme de production intellectuelle de la plateforme.</p>
                                            </div>
                                            <div className="flex items-end justify-between h-[100px] px-2 border-b border-[#d2d2d7]/40 gap-2">
                                                {stats?.monthly_posts_trend && stats.monthly_posts_trend.length > 0 ? (
                                                    stats.monthly_posts_trend.map((s, i) => {
                                                        const maxCount = Math.max(...stats.monthly_posts_trend.map(item => item.count)) || 1;
                                                        const heightPct = Math.max(10, (s.count / maxCount) * 100);
                                                        return (
                                                            <div key={i} className="flex flex-col items-center flex-grow group">
                                                                <div className="text-[10px] font-bold text-[#00c7be] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                                                    {s.count}
                                                                </div>
                                                                <div 
                                                                    style={{ height: `${heightPct}%` }} 
                                                                    className="w-full max-w-[28px] bg-[#00c7be]/80 hover:bg-[#00c7be] rounded-t-[4px] transition-all duration-300"
                                                                />
                                                                <span className="text-[9px] font-semibold text-[#86868b] mt-2 select-none truncate w-full text-center">
                                                                    {s.month}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-6 w-full font-bold">Aucune donnée</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: LISTES & LOGS */}
                                <div className="space-y-6 border-t border-[#d2d2d7]/30 pt-8">
                                    <div className="border-b border-[#d2d2d7]/30 pb-3">
                                        <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[24px] text-[#ff9500]">list_alt</span>
                                            3. Flux d'activité et Journaux Système (10 Listes)
                                        </h2>
                                        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mt-1">
                                            Flux d'activité récents, fichiers importés, avertissements envoyés et logs système en direct.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* List 1: Flux d'activités système */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">timeline</span>
                                                    1. Activités Système Récentes
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Ce journal compile en direct les événements système importants de la plateforme, tels que les inscriptions de nouveaux profils ou les publications récemment créées.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.recent_activities?.map((a, i) => (
                                                        <div key={i} className="p-3 bg-[#f5f5f7]/60 rounded-[10px] border border-black/5 flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-[18px] text-gray-400">
                                                                {a.type === 'NEW_USER' ? 'person_add' : 'chat'}
                                                            </span>
                                                            <div className="min-w-0 flex-grow text-xs font-semibold text-[#1d1d1f]">
                                                                <p className="truncate">{a.description}</p>
                                                                <p className="text-[9px] text-gray-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucune activité récente</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 2: Annonces des enseignants */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#af52de]">campaign</span>
                                                    2. Annonces des Enseignants
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Regroupe les informations et notes officielles communiquées directement par le corps professoral de l'IGA à l'attention des étudiants.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.teacher_announcements?.map((a, i) => (
                                                        <div key={i} className="p-3 bg-[#af52de]/5 rounded-[10px] border border-[#af52de]/10 flex flex-col gap-1 text-xs">
                                                            <div className="flex justify-between font-bold text-[#af52de]">
                                                                <span>{a.author}</span>
                                                                <span className="text-[9px] font-semibold text-gray-400">{new Date(a.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-gray-600 font-medium">{a.content}</p>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucune annonce</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 3: Fichiers récents partagés */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ff3b30]">attachment</span>
                                                    3. Justificatifs & Fichiers Récents
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Liste des justificatifs académiques (diplômes et attestations importés) ou des documents insérés au sein des publications récentes.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.uploaded_files_log?.map((f, i) => (
                                                        <div key={i} className="p-3 bg-[#f5f5f7]/60 rounded-[10px] border border-black/5 flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="material-symbols-outlined text-[18px] text-red-500">picture_as_pdf</span>
                                                                <span className="font-bold text-[#1d1d1f] truncate" title={f.name}>{f.name}</span>
                                                            </div>
                                                            <a 
                                                                href={`${API_BASE}/storage/${f.url}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="h-6 px-2.5 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white rounded-[6px] flex items-center justify-center transition-all font-bold text-[10px] decoration-none"
                                                            >
                                                                Ouvrir
                                                            </a>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun fichier partagé</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 4: Candidats à l'avertissement */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ff9500]">warning</span>
                                                    4. Comptes les Plus Signalés
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Affiche les membres comptabilisant le plus de signalements de comportement par d'autres utilisateurs, requérant l'attention urgente de la modération.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.warning_candidates?.map((w, i) => (
                                                        <div key={i} className="p-3 bg-[#ff9500]/5 rounded-[10px] border border-[#ff9500]/10 flex justify-between items-center text-xs font-bold">
                                                            <span className="text-[#1d1d1f]">{w.name}</span>
                                                            <span className="text-red-500 bg-red-100/50 px-2 py-0.5 rounded-[5px] text-[10px]">{w.count} signalements</span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun signalement</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 5: Leaders de réseau */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#34c759]">hub</span>
                                                    5. Leaders de Réseau
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Classement des profils disposant du plus grand nombre de connexions d'amis acceptées sur Scholar Network, désignant les membres les plus connectés.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.network_leaders?.map((l, i) => (
                                                        <div key={i} className="p-3 bg-[#34c759]/5 rounded-[10px] border border-[#34c759]/10 flex justify-between items-center text-xs font-bold">
                                                            <span className="text-[#1d1d1f]">{l.name}</span>
                                                            <span className="text-[#34c759] bg-[#34c759]/15 px-2 py-0.5 rounded-[5px] text-[10px]">{l.count} relations</span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun leader de réseau</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 6: Mots-clés populaires */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#00c7be]">tag</span>
                                                    6. Mots-clés & Hashtags Populaires
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Liste des mots-clés thématiques les plus populaires et récurrents répertoriés au sein des discussions et publications partagées.</p>
                                                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.trending_keywords?.map((k, i) => (
                                                        <div key={i} className="px-3 py-1.5 bg-[#f5f5f7] border border-[#d2d2d7]/50 rounded-full text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5 hover:bg-[#ebebeb] transition-colors cursor-default">
                                                            <span>{k.tag}</span>
                                                            <span className="text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-full border border-black/5">{k.score}pts</span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun mot-clé populaire</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 7: Historique des avertissements */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ff3b30]">history_edu</span>
                                                    7. Historique des Avertissements
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Ce log consigne les derniers avertissements formels envoyés par les administrateurs aux membres pour des écarts de comportement ou des publications inappropriées.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.warnings_history?.map((w, i) => (
                                                        <div key={i} className="p-3 bg-red-50/50 border border-red-100 rounded-[10px] text-xs">
                                                            <div className="flex justify-between font-bold text-red-600 mb-1">
                                                                <span>{w.name}</span>
                                                                <span className="text-[9px] text-gray-400 font-semibold">{new Date(w.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-gray-600 font-medium">{w.message}</p>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun avertissement envoyé</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 8: Derniers projets créés */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#0071e3]">topic</span>
                                                    8. Derniers Projets Académiques Créés
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Liste chronologique récapitulant les titres des derniers espaces de travail de projets collaboratifs universitaires créés par les membres.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.latest_created_projects?.map((p, i) => (
                                                        <div key={i} className="p-3 bg-[#f5f5f7]/60 border border-black/5 rounded-[10px] flex justify-between items-center text-xs">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-[#1d1d1f] truncate" title={p.title}>{p.title}</p>
                                                                <p className="text-[9px] text-gray-400 mt-0.5">{p.max_members} membres max</p>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                                                                p.status === 'OPEN' ? 'bg-[#34c759]/10 text-[#34c759]' : 'bg-[#ff3b30]/10 text-[#ff3b30]'
                                                            }`}>
                                                                {p.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                                                            </span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun projet récent</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 9: Canaux actifs */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#ff9500]">forum</span>
                                                    9. Canaux de Discussion les plus Actifs
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Récapitule les salons et canaux de tchat (canaux généraux ou de projets) enregistrant le plus fort volume d'échanges de messages par les utilisateurs.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.active_discussion_channels?.map((c, i) => (
                                                        <div key={i} className="p-3 bg-[#f5f5f7]/60 border border-black/5 rounded-[10px] flex justify-between items-center text-xs font-bold">
                                                            <span className="text-[#1d1d1f]">#{c.name}</span>
                                                            <span className="text-[#ff9500] bg-[#ff9500]/10 px-2 py-0.5 rounded-[5px] text-[10px]">{c.count} messages</span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun canal actif</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* List 10: Logs Connexions */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-[#86868b]">history</span>
                                                    10. Connexions Utilisateurs Récentes
                                                </h4>
                                                <p className="text-[11px] text-[#86868b] mb-4">Ce log système horodate les dernières connexions réussies d'utilisateurs actifs au sein de la plateforme, pour la surveillance d'activité.</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                                                    {stats?.recent_login_logs?.map((l, i) => (
                                                        <div key={i} className="p-3 bg-gray-50 border border-black/5 rounded-[10px] flex justify-between items-center text-xs">
                                                            <span className="font-bold text-[#1d1d1f]">{l.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-semibold">{new Date(l.time).toLocaleString()}</span>
                                                        </div>
                                                    )) || <p className="text-xs text-gray-400 text-center py-6 font-bold">Aucun log récent</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 4: TABLEAUX */}
                                <div className="space-y-6 border-t border-[#d2d2d7]/30 pt-8">
                                    <div className="border-b border-[#d2d2d7]/30 pb-3">
                                        <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[24px] text-[#af52de]">table_chart</span>
                                            4. Grilles de données tabulaires (10 Tableaux de base SQL)
                                        </h2>
                                        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mt-1">
                                            Listages et grilles détaillées des données relationnelles issues de la base SQL.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        {/* Table 1: Top membres actifs */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#0071e3]">military_tech</span>
                                                1. Top Membres Actifs (Publications)
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Classement des 5 membres les plus engagés en termes de nombre total de publications partagées.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Nom</th>
                                                            <th className="py-2 pb-2">Email</th>
                                                            <th className="py-2 pb-2">Rôle</th>
                                                            <th className="py-2 pb-2 text-right">Posts</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.top_users?.map((u, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{u.name}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{u.email}</td>
                                                                <td className="py-2.5 pr-2"><RoleBadge role={u.role} /></td>
                                                                <td className="py-2.5 text-right font-bold text-[#0071e3]">{u.posts_count}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 2: Derniers inscrits */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#34c759]">person_add</span>
                                                2. Derniers Membres Inscrits
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Liste des derniers utilisateurs enregistrés sur la plateforme, indiquant leur statut d'accès et leur date d'inscription.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Nom</th>
                                                            <th className="py-2 pb-2">Email</th>
                                                            <th className="py-2 pb-2">Statut</th>
                                                            <th className="py-2 pb-2 text-right">Inscrit le</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.recent_users?.map((u, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{u.name}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{u.email}</td>
                                                                <td className="py-2.5 pr-2"><StatusBadge status={u.status} /></td>
                                                                <td className="py-2.5 text-right text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 3: Projets académiques récents */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#af52de]">folder_open</span>
                                                3. Liste des Projets Récents
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Grille listant les derniers espaces de projets créés, détaillant leur type de recherche et leur capacité de membres autorisés.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Titre du Projet</th>
                                                            <th className="py-2 pb-2">Type</th>
                                                            <th className="py-2 pb-2">Membres Max</th>
                                                            <th className="py-2 pb-2 text-right">Créé le</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.recent_projects?.map((p, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f] truncate max-w-[150px]">{p.title}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{p.type}</td>
                                                                <td className="py-2.5 pr-2 text-center font-bold">{p.max_members}</td>
                                                                <td className="py-2.5 text-right text-gray-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 4: Publications à Fort Engagement */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#ff2d55]">insights</span>
                                                4. Publications les Plus Populaires
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Classement des publications de membres ayant reçu le plus grand nombre d'interactions cumulées (likes et commentaires).</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Titre / Contenu</th>
                                                            <th className="py-2 pb-2">Auteur</th>
                                                            <th className="py-2 pb-2 text-center">Likes</th>
                                                            <th className="py-2 pb-2 text-right">Coms</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.high_engagement_posts?.map((p, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f] truncate max-w-[150px]">{p.title}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{p.author}</td>
                                                                <td className="py-2.5 pr-2 text-center text-red-500 font-bold">👍 {p.likes}</td>
                                                                <td className="py-2.5 text-right text-blue-500 font-bold">💬 {p.comments}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 5: Signalements Récents non résolus */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#ff3b30]">report_problem</span>
                                                5. Signalements Actifs (En attente)
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Grille répertoriant les signalements de contenus non encore résolus par les administrateurs, précisant le motif de l'alerte.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Signalé par</th>
                                                            <th className="py-2 pb-2">Raison / Motif</th>
                                                            <th className="py-2 pb-2">Cible ID</th>
                                                            <th className="py-2 pb-2 text-right">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.recent_pending_reports?.map((r, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{r.reporter}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500 truncate max-w-[150px]" title={r.reason}>{r.reason}</td>
                                                                <td className="py-2.5 pr-2 font-mono text-gray-400">#{r.reported_id}</td>
                                                                <td className="py-2.5 text-right text-gray-400">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 6: Demandes académiques en attente */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#ff9500]">pending_actions</span>
                                                6. Validations Académiques Reçues
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Tableau listant les demandes d'inscription de professeurs ou chercheurs nécessitant l'approbation de l'administration.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Membre</th>
                                                            <th className="py-2 pb-2">Institution</th>
                                                            <th className="py-2 pb-2">Rôle demandé</th>
                                                            <th className="py-2 pb-2 text-right">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.pending_academic_users?.map((u, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{u.name}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{u.institution}</td>
                                                                <td className="py-2.5 pr-2"><RoleBadge role={u.role} /></td>
                                                                <td className="py-2.5 text-right text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 7: Bloqués récemment */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#86868b]">lock</span>
                                                7. Utilisateurs Récemment Bloqués
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Registre des comptes d'utilisateurs suspendus ou bloqués suite à une décision administrative ou des signalements avérés.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Nom</th>
                                                            <th className="py-2 pb-2">Email</th>
                                                            <th className="py-2 pb-2 text-right">Bloqué le</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.recently_blocked_users?.map((u, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{u.name}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{u.email}</td>
                                                                <td className="py-2.5 text-right text-red-500">{new Date(u.updated_at).toLocaleDateString()}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={3} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 8: Commentaires signalés ou récents */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#00c7be]">comment</span>
                                                8. Modération des Commentaires Récents
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Grille des derniers commentaires ajoutés, offrant la possibilité de suppression instantanée en cas de non-conformité.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Auteur</th>
                                                            <th className="py-2 pb-2">Publication</th>
                                                            <th className="py-2 pb-2">Commentaire</th>
                                                            <th className="py-2 pb-2 text-right">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.recent_flagged_comments?.map((c, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{c.author}</td>
                                                                <td className="py-2.5 pr-2 text-gray-400 truncate max-w-[100px]">{c.post_title}</td>
                                                                <td className="py-2.5 pr-2 text-gray-600 truncate max-w-[150px]">{c.content}</td>
                                                                <td className="py-2.5 text-right text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 9: Activité par Institution */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#0071e3]">lan</span>
                                                9. Nombre d'Inscrits par Établissement
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Répartition quantitative des utilisateurs enregistrés sur le réseau Scholar Network selon leur campus ou institution d'attache.</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Département / Établissement</th>
                                                            <th className="py-2 pb-2 text-right">Membres Enregistrés</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.department_activity?.map((d, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{d.department}</td>
                                                                <td className="py-2.5 text-right font-extrabold text-[#0071e3]">{d.users_count}</td>
                                                            </tr>
                                                        )) || <tr><td colSpan={2} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Table 10: Comptes Administration */}
                                        <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-5 shadow-apple-sm overflow-hidden">
                                            <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-1 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[18px] text-[#ff3b30]">security</span>
                                                10. Liste des Administrateurs Système
                                            </h4>
                                            <p className="text-[11px] text-[#86868b] mb-4">Registre complet affichant les identités et statuts des utilisateurs disposant des droits administratifs (rôle ADMIN).</p>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-[#d2d2d7]/30 text-[#86868b] font-bold uppercase tracking-wider">
                                                            <th className="py-2 pb-2">Nom de l'Admin</th>
                                                            <th className="py-2 pb-2">Adresse Email</th>
                                                            <th className="py-2 pb-2 text-right">Statut</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#d2d2d7]/20 font-medium">
                                                        {stats?.admin_accounts?.map((a, i) => (
                                                            <tr key={i} className="hover:bg-[#f5f5f7]/50">
                                                                <td className="py-2.5 pr-2 font-bold text-[#1d1d1f]">{a.name}</td>
                                                                <td className="py-2.5 pr-2 text-gray-500">{a.email}</td>
                                                                <td className="py-2.5 text-right"><StatusBadge status={a.status} /></td>
                                                            </tr>
                                                        )) || <tr><td colSpan={3} className="py-4 text-center text-gray-400">Aucune donnée</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── PENDING VALIDATIONS TAB ───────────────────────── */}
                        {tab === 'PENDING' && (
                            <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-[#d2d2d7]/30 bg-[#ff9500]/5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ff9500] text-[20px]">verified_user</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                        Comptes académiques en attente de vérification
                                    </h2>
                                </div>
                                {pendingUsers.length === 0 ? (
                                    <div className="py-20 text-center text-left">
                                        <div className="w-12 h-12 bg-[#34c759]/10 text-[#34c759] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-symbols-outlined text-[24px]">task_alt</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucune demande en attente</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#d2d2d7]/30 text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="px-6 py-3.5 text-left font-bold">Utilisateur</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Rôle / Établissement</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Justificatifs</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Inscrit</th>
                                                    <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#d2d2d7]/20">
                                                {pendingUsers.map(u => (
                                                    <tr key={u.id} className="hover:bg-[#f5f5f7]/50 transition-colors text-left">
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
                                                            <p className="text-[11px] text-[#86868b] mt-1.5">{u.profile?.institution || 'IGA Casablanca'}</p>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex gap-2">
                                                                {u.profile?.diploma_url ? (
                                                                    <a 
                                                                        href={`${API_BASE}/storage/${u.profile.diploma_url}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="h-8 w-8 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white rounded-[8px] flex items-center justify-center transition-all shadow-sm"
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
                                                                        className="h-8 w-8 bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white rounded-[8px] flex items-center justify-center transition-all shadow-sm"
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
                                                                <button onClick={() => handleApprove(u.id)} className="h-[36px] px-4 bg-[#34c759] hover:bg-[#30b350] text-white rounded-[10px] text-[13px] font-semibold transition-all press-effect shadow-sm flex items-center gap-1 border-none cursor-pointer">
                                                                    <span className="material-symbols-outlined text-[16px]">done</span> Valider
                                                                </button>
                                                                <button onClick={() => handleReject(u.id)} className="h-[36px] px-4 bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white rounded-[10px] text-[13px] font-semibold transition-all press-effect flex items-center gap-1.5 border-none cursor-pointer">
                                                                    <span className="material-symbols-outlined text-[16px]">close</span> Rejeter
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
                            <div className="space-y-4 animate-fadeIn">
                                {/* Search and Filter Toolbar */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm items-center">
                                    {/* Search by Name/Email */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Nom ou email..."
                                            className="w-full h-[38px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] pl-10 pr-3 text-xs outline-none transition-all font-semibold"
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Filter by Institution */}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">school</span>
                                        <input 
                                            type="text" 
                                            placeholder="Institution (Ex: IGA)..."
                                            className="w-full h-[38px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] pl-10 pr-3 text-xs outline-none transition-all font-semibold"
                                            value={memberInstitutionFilter}
                                            onChange={(e) => setMemberInstitutionFilter(e.target.value)}
                                        />
                                    </div>

                                    {/* Filter by Role */}
                                    <CustomSelect
                                        value={memberRoleFilter}
                                        onChange={setMemberRoleFilter}
                                        options={[
                                            { value: 'ALL', label: 'Tous les rôles' },
                                            { value: 'STUDENT', label: 'Étudiants' },
                                            { value: 'TEACHER', label: 'Enseignants' },
                                            { value: 'RESEARCHER', label: 'Chercheurs' },
                                            { value: 'ADMIN', label: 'Administrateurs' }
                                        ]}
                                    />

                                    {/* Filter by Status */}
                                    <CustomSelect
                                        value={memberStatusFilter}
                                        onChange={setMemberStatusFilter}
                                        options={[
                                            { value: 'ALL', label: 'Tous les statuts' },
                                            { value: 'ACTIVE', label: 'Actifs' },
                                            { value: 'PENDING', label: 'En attente' },
                                            { value: 'BLOCKED', label: 'Bloqués' },
                                            { value: 'DISABLED', label: 'Désactivés' }
                                        ]}
                                    />
                                </div>

                                <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm overflow-hidden">
                                    <div className="px-6 py-5 border-b border-[#d2d2d7]/30 bg-slate-50/50 flex items-center justify-between text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#0071e3] text-[20px]">group</span>
                                            <h2 className="font-bold text-[#1d1d1f] text-[15px]">
                                                Membres inscrits au réseau ({filteredUsers.length})
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#d2d2d7]/30 text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="px-6 py-3.5 text-left font-bold">Membre</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Rôle</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Statut</th>
                                                    <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#d2d2d7]/20">
                                                {filteredUsers.map(u => (
                                                    <tr key={u.id} className="hover:bg-[#f5f5f7]/50 transition-colors text-left">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div 
                                                                onClick={() => handleEditUser(u)}
                                                                className="flex items-center gap-3 cursor-pointer group select-none"
                                                                title="Cliquer pour voir les détails et modifier ce membre"
                                                            >
                                                                <div className="h-[38px] w-[38px] rounded-full bg-[#f5f5f7] flex items-center justify-center font-bold text-[#86868b] text-xs flex-shrink-0 overflow-hidden border border-[#d2d2d7]/50 group-hover:border-[#0071e3] transition-colors">
                                                                    {u.profile?.photo_url ? (
                                                                        <img src={`${API_BASE}/storage/${u.profile.photo_url}`} className="w-full h-full object-cover" alt="" />
                                                                    ) : (
                                                                        <span>{u.first_name?.[0]}{u.last_name?.[0]}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-[13px] text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">{u.first_name} {u.last_name}</p>
                                                                    <p className="text-[10px] text-[#86868b]">{u.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap"><RoleBadge role={u.role} /></td>
                                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={u.status} /></td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex justify-end gap-1.5 flex-wrap max-w-[320px] ml-auto">
                                                                {/* View Details / Edit */}
                                                                <button
                                                                    onClick={() => handleEditUser(u)}
                                                                    title="Voir et modifier les informations de ce membre"
                                                                    className="h-[28px] px-2.5 rounded-[7px] bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white flex items-center gap-1 transition-all press-effect border-none cursor-pointer shadow-sm text-[10px] font-bold"
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">edit</span> Infos
                                                                </button>

                                                                {/* Toggle Status (Block / Unblock) */}
                                                                {u.role !== 'ADMIN' && (
                                                                    <button
                                                                        onClick={() => handleToggleStatus(u.id)}
                                                                        title={u.status === 'ACTIVE' ? 'Bloquer ce compte' : 'Débloquer ce compte'}
                                                                        className={`h-[28px] px-2.5 rounded-[7px] flex items-center gap-1 transition-all press-effect border-none cursor-pointer shadow-sm text-[10px] font-bold ${
                                                                            u.status === 'ACTIVE' 
                                                                                ? 'bg-[#ff9500]/10 text-[#ff9500] hover:bg-[#ff9500] hover:text-white' 
                                                                                : 'bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white'
                                                                        }`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">
                                                                            {u.status === 'ACTIVE' ? 'block' : 'lock_open'}
                                                                        </span>
                                                                        {u.status === 'ACTIVE' ? 'Bloquer' : 'Débloquer'}
                                                                    </button>
                                                                )}

                                                                {/* Send Warning */}
                                                                {u.role !== 'ADMIN' && (
                                                                    <button
                                                                        onClick={() => setWarnTarget(u)}
                                                                        title="Envoyer un avertissement"
                                                                        className="h-[28px] px-2.5 rounded-[7px] bg-[#ffcc00]/15 text-[#b28900] hover:bg-[#ffcc00] hover:text-white flex items-center gap-1 transition-all press-effect border-none cursor-pointer shadow-sm text-[10px] font-bold"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">warning</span> Avertir
                                                                    </button>
                                                                )}

                                                                {/* Delete */}
                                                                {u.role !== 'ADMIN' && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u.id)}
                                                                        title="Supprimer définitivement"
                                                                        className="h-[28px] px-2.5 rounded-[7px] bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white flex items-center gap-1 transition-all press-effect border-none cursor-pointer shadow-sm text-[10px] font-bold"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">delete</span> Supprimer
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
                            </div>
                        )}

                        {/* ── POSTS MODERATION TAB ──────────────────────────── */}
                        {tab === 'POSTS' && (
                            <div className="space-y-4 animate-fadeIn">
                                {/* Search and Filter Toolbar */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm items-center">
                                    {/* Search Content */}
                                    <div className="relative md:col-span-4">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher par titre, mot-clé..."
                                            className="w-full h-[38px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] pl-10 pr-3 text-xs outline-none transition-all font-semibold"
                                            value={postSearch}
                                            onChange={(e) => setPostSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Filter by Author */}
                                    <div className="relative md:col-span-3">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">person_search</span>
                                        <input 
                                            type="text" 
                                            placeholder="Auteur (Nom/Prénom)..."
                                            className="w-full h-[38px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] pl-10 pr-3 text-xs outline-none transition-all font-semibold"
                                            value={postAuthorSearch}
                                            onChange={(e) => setPostAuthorSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3 w-full md:col-span-5 justify-end">
                                        {/* Custom macOS Role Filter Dropdown */}
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsPostRoleDropdownOpen(!isPostRoleDropdownOpen)}
                                                className="h-[38px] px-4 bg-[#f5f5f7] hover:bg-[#ebebeb] border border-[#d2d2d7]/50 rounded-[10px] text-xs font-semibold outline-none text-[#1d1d1f] cursor-pointer flex items-center justify-between gap-2.5 transition-all select-none min-w-[150px]"
                                            >
                                                <span>
                                                    {postRoleFilter === 'ALL' && 'Tous les rôles'}
                                                    {postRoleFilter === 'STUDENT' && 'Étudiants'}
                                                    {postRoleFilter === 'TEACHER' && 'Enseignants'}
                                                    {postRoleFilter === 'RESEARCHER' && 'Chercheurs'}
                                                    {postRoleFilter === 'ADMIN' && 'Administrateurs'}
                                                </span>
                                                <span 
                                                    className="material-symbols-outlined text-[15px] text-gray-500 transition-transform duration-200"
                                                    style={{ transform: isPostRoleDropdownOpen ? 'rotate(180deg)' : 'none' }}
                                                >
                                                    expand_more
                                                </span>
                                            </button>

                                            {isPostRoleDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsPostRoleDropdownOpen(false)} />
                                                    <div className="absolute right-0 mt-1.5 w-[200px] bg-white border border-[#d2d2d7]/40 rounded-[12px] shadow-apple-lg py-1.5 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left">
                                                        {[
                                                            { id: 'ALL', label: 'Tous les rôles' },
                                                            { id: 'STUDENT', label: 'Étudiants' },
                                                            { id: 'TEACHER', label: 'Enseignants' },
                                                            { id: 'RESEARCHER', label: 'Chercheurs' },
                                                            { id: 'ADMIN', label: 'Administrateurs' }
                                                        ].map((r) => (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setPostRoleFilter(r.id);
                                                                    setIsPostRoleDropdownOpen(false);
                                                                }}
                                                                className={`w-full px-4 py-2 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between border-none cursor-pointer bg-transparent font-semibold text-xs ${
                                                                    postRoleFilter === r.id ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                                }`}
                                                            >
                                                                <span>{r.label}</span>
                                                                {postRoleFilter === r.id && (
                                                                    <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Media filter (macOS Segmented Control) */}
                                        <div className="flex bg-[#767680]/8 p-0.5 rounded-[9px] border border-black/5">
                                            {[
                                                { id: 'ALL', label: 'Tout' },
                                                { id: 'TEXT', label: 'Texte' },
                                                { id: 'IMAGE', label: 'Photos' },
                                                { id: 'VIDEO', label: 'Vidéos' },
                                                { id: 'PDF', label: 'PDFs' }
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setPostMediaFilter(m.id)}
                                                    className={`h-[28px] px-3.5 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer border-none flex items-center justify-center ${
                                                        postMediaFilter === m.id 
                                                            ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.1)] font-semibold' 
                                                            : 'text-[#6e6e73] hover:text-[#1d1d1f] bg-transparent'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* List of Publications Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredPosts.map(post => {
                                        const fileUrls = post.file_urls || (post.file_url ? [post.file_url] : []);
                                        const isImage = post.media_type === 'IMAGE' || (fileUrls.length > 0 && fileUrls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i));
                                        const isVideo = post.media_type === 'VIDEO' || (fileUrls.length > 0 && fileUrls[0].match(/\.(mp4|mov|avi|mpeg)$/i));
                                        const isPdf = post.media_type === 'PDF' || (fileUrls.length > 0 && fileUrls[0].match(/\.pdf$/i)) || post.type === 'SCIENTIFIC_ARTICLE';

                                        return (
                                            <div key={post.id} className="bg-white border border-[#d2d2d7]/40 rounded-[20px] p-6 shadow-apple-sm hover:shadow-apple-md transition-all flex flex-col justify-between text-left">
                                                <div>
                                                    {/* Header: Author + Date */}
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="h-10 w-10 rounded-full bg-[#f5f5f7] border border-[#d2d2d7]/50 flex items-center justify-center font-bold text-[#86868b] text-sm flex-shrink-0 overflow-hidden">
                                                            {post.author?.profile?.photo_url ? (
                                                                <img src={`${API_BASE}/storage/${post.author.profile.photo_url}`} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <span>{post.author?.first_name?.[0]}{post.author?.last_name?.[0]}</span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 text-left">
                                                            <p className="font-bold text-[13px] text-[#1d1d1f] truncate leading-tight">{post.author?.first_name} {post.author?.last_name}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
                                                                    post.type === 'SCIENTIFIC_ARTICLE' ? 'bg-[#af52de]/10 text-[#af52de]' :
                                                                    post.type === 'UNIVERSITY_PROJECT' ? 'bg-[#34c759]/10 text-[#34c759]' :
                                                                    'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                    {post.type === 'SCIENTIFIC_ARTICLE' ? 'Article' : post.type === 'UNIVERSITY_PROJECT' ? 'Projet' : 'Général'}
                                                                </span>
                                                                <span className="text-[10px] text-[#86868b] font-medium">• {new Date(post.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Title (if any) */}
                                                    {(post.title || post.article_title) && (
                                                        <h4 className="font-bold text-[14px] text-[#1d1d1f] mb-2 leading-snug line-clamp-1">
                                                            {post.title || post.article_title}
                                                        </h4>
                                                    )}

                                                    {/* Content */}
                                                    <p className="text-[13px] text-[#48484a] leading-relaxed line-clamp-3 mb-4 font-medium">
                                                        {post.content}
                                                    </p>

                                                    {/* Media previews */}
                                                    {fileUrls.length > 0 && (
                                                        <div className="mb-4 rounded-xl overflow-hidden border border-black/5 bg-[#f5f5f7] max-h-[160px] flex items-center justify-center">
                                                            {isImage && (
                                                                <img src={`${API_BASE}/storage/${fileUrls[0]}`} className="w-full h-full object-cover max-h-[160px]" alt="Attachment" />
                                                            )}
                                                            {isVideo && (
                                                                <video src={`${API_BASE}/storage/${fileUrls[0]}`} className="w-full max-h-[160px] object-cover" controls />
                                                            )}
                                                            {isPdf && (
                                                                <div className="p-3 flex items-center gap-3 w-full text-left bg-white/50">
                                                                    <span className="material-symbols-outlined text-[24px] text-red-500">picture_as_pdf</span>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[11px] font-bold text-[#1d1d1f] truncate">Document PDF Académique</p>
                                                                        <p className="text-[9px] text-[#86868b] font-semibold uppercase tracking-wider">Format joint</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer: Stats & Actions */}
                                                <div className="flex items-center justify-between pt-4 border-t border-[#d2d2d7]/30 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPostDetails(post)}
                                                        className="flex items-center gap-2 text-[10px] text-[#86868b] hover:text-[#0071e3] font-bold uppercase cursor-pointer bg-[#767680]/5 hover:bg-[#0071e3]/10 px-2.5 py-1.5 rounded-[8px] transition-all border-none select-none"
                                                        title="Voir les commentaires et réactions"
                                                    >
                                                        <span>👍 {post.likes_count ?? 0} likes</span>
                                                        <span>•</span>
                                                        <span>💬 {post.comments_count ?? 0} coms</span>
                                                    </button>
                                                    <div className="flex gap-2">
                                                        {/* Edit Post */}
                                                        <button
                                                            onClick={() => handleEditPost(post)}
                                                            className="h-[36px] px-4 bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white rounded-[10px] text-[13px] font-semibold transition-all press-effect flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">edit</span> Modifier
                                                        </button>
                                                        {/* Delete Post */}
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="h-[36px] px-4 bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white rounded-[10px] text-[13px] font-semibold transition-all press-effect flex items-center gap-1.5 border-none cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span> Supprimer
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredPosts.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-white border border-[#d2d2d7]/40 rounded-[20px]">
                                            <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">article</span>
                                            <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucune publication correspondante</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── REPORTS TAB ───────────────────────────────────── */}
                        {tab === 'REPORTS' && (
                            <div className="bg-white border border-[#d2d2d7]/40 rounded-[20px] shadow-apple-sm overflow-hidden animate-fadeIn">
                                <div className="px-6 py-5 border-b border-[#d2d2d7]/30 bg-[#ff3b30]/5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ff3b30] text-[20px]">flag</span>
                                    <h2 className="font-bold text-[#1d1d1f] text-[15px] text-left">
                                        Modération : Contenus signalés par la communauté
                                    </h2>
                                </div>
                                {reports.length === 0 ? (
                                    <div className="py-20 text-center text-left">
                                        <div className="w-12 h-12 bg-[#34c759]/10 text-[#34c759] rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-symbols-outlined text-[24px]">verified</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Aucun signalement en attente</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#d2d2d7]/30 text-[10px] font-bold text-[#86868b] uppercase tracking-widest bg-gray-50/50">
                                                    <th className="px-6 py-3.5 text-left font-bold">Signalé par</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Type / Cible</th>
                                                    <th className="px-6 py-3.5 text-left font-bold">Statut</th>
                                                    <th className="px-6 py-3.5 text-right font-bold">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#d2d2d7]/20">
                                                {reports.map(r => (
                                                    <tr key={r.id} className="hover:bg-[#f5f5f7]/50 transition-colors group text-left">
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
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handleResolveReport(r.id, 'RESOLVED')} className="h-[36px] px-4 bg-[#34c759] text-white hover:bg-[#30b350] rounded-[10px] text-[13px] font-semibold transition-all press-effect shadow-sm cursor-pointer border-none">
                                                                        Résoudre
                                                                    </button>
                                                                    <button onClick={() => handleResolveReport(r.id, 'DISMISSED')} className="h-[36px] px-4 bg-[#767680]/10 text-[#1d1d1f] hover:bg-[#767680]/15 rounded-[10px] text-[13px] font-semibold transition-all press-effect cursor-pointer border-none">
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
